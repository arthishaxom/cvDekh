import type { Job } from "bullmq";
import type { Response } from "express";
import { pdfQueue, resumeQueue } from "../config/bullmq.config";
import logger from "../config/logger.config";
import type { JobDesc } from "../models/job.model";
import type { ResumeData } from "../models/resume.model";
import { aiService } from "../services/ai.service";
import { resumeService } from "../services/resume.service";
import type { AuthenticatedRequest } from "../types/auth.type";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const parseResume = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
      throw new ApiError(400, "No file uploaded");
    }

    if (!req.user || !req.supabaseClient) {
      throw new ApiError(
        401,
        "Authentication error or client not initialized."
      );
    }

    // Instead of processing immediately, add job to queue
    let job: Job;
    try {
      job = await resumeQueue.add("parse-resume", {
        userId: req.user.id,
        filePath: req.file.path, // File path instead of buffer
        originalName: req.file.originalname,
        // Pass the JWT token for the worker to create its own Supabase client
        userToken:
          typeof req.headers.authorization === "string"
            ? req.headers.authorization.split(" ")[1]
            : undefined,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Only PDF files are allowed"
      ) {
        throw new ApiError(400, error.message);
      }
      throw new ApiError(
        500,
        "Internal server error while adding job to queue",
        [error instanceof Error ? error.message : "Unknown error"]
      );
    }

    // Return job ID immediately - don't wait for processing
    res
      .status(202)
      .json(
        new ApiResponse(202, { jobId: job.id }, "Resume parsing job accepted")
      );
  }
);

const getParseResumeStatus = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { jobId } = req.params;
    const job = await resumeQueue.getJob(jobId);

    if (!job) {
      throw new ApiError(404, "Job not found");
    }

    const state = await job.getState();
    const progress = job.progress;
    const returnValue = job.returnvalue;
    const failedReason = job.failedReason;

    if (state === "completed") {
      res.json(
        new ApiResponse(
          200,
          {
            status: "completed",
            resume: returnValue,
            progress: typeof progress === "number" ? progress : 100,
          },
          "Resume parsing completed"
        )
      );
    } else if (state === "failed") {
      throw new ApiError(500, "Resume parsing failed", [
        typeof failedReason === "string" ? failedReason : "Unknown error",
      ]);
    } else {
      res.json(
        new ApiResponse(
          200,
          {
            status: state,
            progress: typeof progress === "number" ? progress : 0,
          },
          "Resume parsing in progress"
        )
      );
    }
  }
);

// ✅ UPDATED: Use PDF worker strategy instead of direct generation
const generateResumePdf = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user || !req.supabaseClient) {
      throw new ApiError(
        401,
        "Authentication error or client not initialized."
      );
    }

    const { resumeId } = req.params;
    const userId = req.user.id;

    // ✅ Validate resume exists before adding to queue
    const resumeData: ResumeData | null = resumeId
      ? await resumeService.getResumeById(req.supabaseClient, resumeId, userId)
      : await resumeService.getOriginalResume(req.supabaseClient, userId);

    if (!resumeData) {
      throw new ApiError(404, "No resume data found");
    }

    // ✅ Add PDF generation job to queue instead of direct processing
    let job: Job;
    try {
      job = await pdfQueue.add("generate-pdf", {
        userId: userId,
        resumeId: resumeId || null, // null for original resume
        // Pass the JWT token for the worker to create its own Supabase client
        userToken:
          typeof req.headers.authorization === "string"
            ? req.headers.authorization.split(" ")[1]
            : undefined,
      });

      logger.info(
        `PDF generation job ${job.id} added to queue for user ${userId}`
      );
    } catch (error) {
      logger.error("Error adding PDF generation job to queue:", error);
      throw new ApiError(
        500,
        "Internal server error while adding PDF generation job to queue",
        [error instanceof Error ? error.message : "Unknown error"]
      );
    }

    // ✅ Return job ID immediately - don't wait for processing
    res
      .status(202)
      .json(
        new ApiResponse(202, { jobId: job.id }, "PDF generation job accepted")
      );
  }
);

// ✅ NEW: Get PDF generation status endpoint
const getPdfGenerationStatus = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { jobId } = req.params;

    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const job = await pdfQueue.getJob(jobId);

    if (!job) {
      throw new ApiError(404, "PDF generation job not found");
    }

    // ✅ Security check: ensure user can only access their own jobs
    if (job.data.userId !== req.user.id) {
      throw new ApiError(403, "Access denied to this job");
    }

    const state = await job.getState();
    const progress = job.progress;
    const returnValue = job.returnvalue;
    const failedReason = job.failedReason;

    if (state === "completed") {
      res.json(
        new ApiResponse(
          200,
          {
            status: "completed",
            data: returnValue,
            progress: typeof progress === "number" ? progress : 100,
          },
          "PDF generation completed"
        )
      );
    } else if (state === "failed") {
      logger.error(`PDF generation job ${jobId} failed:`, failedReason);
      throw new ApiError(500, "PDF generation failed", [
        typeof failedReason === "string" ? failedReason : "Unknown error",
      ]);
    } else {
      res.json(
        new ApiResponse(
          200,
          {
            status: state,
            progress: typeof progress === "number" ? progress : 0,
          },
          "PDF generation in progress"
        )
      );
    }
  }
);

const getResume = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user || !req.supabaseClient) {
      throw new ApiError(
        401,
        "Authentication error or client not initialized."
      );
    }

    const data = await resumeService.getOriginalResume(
      req.supabaseClient,
      req.user.id
    );

    if (!data) {
      throw new ApiError(404, "No resume data found");
    }

    res.json(new ApiResponse(200, data, "Resume data fetched successfully"));
  }
);

const improveResume = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user || !req.supabaseClient) {
      throw new ApiError(
        401,
        "Authentication error or client not initialized."
      );
    }

    const { job_desc } = req.body;
    if (!job_desc || typeof job_desc !== "string") {
      throw new ApiError(400, "Missing or invalid 'job_desc' in request body.");
    }

    const originalResumeData = await resumeService.getOriginalResume(
      req.supabaseClient,
      req.user.id
    );

    if (!originalResumeData) {
      throw new ApiError(404, "Original resume not found.");
    }

    const filteredResumeData = {
      summary: originalResumeData.summary,
      projects: originalResumeData.projects,
      skills: originalResumeData.skills,
    };

    const improvementResult = await aiService.improveResume(
      filteredResumeData,
      job_desc
    );

    if (!improvementResult) {
      res
        .status(201)
        .json(new ApiResponse(201, originalResumeData, "No improvement made"));
      return;
    }

    const finalImprovedResume = {
      ...originalResumeData,
      summary:
        improvementResult.improvedResume.summary || originalResumeData.summary,
      projects:
        improvementResult.improvedResume.projects ||
        originalResumeData.projects,
    };

    const newImprovedResumeEntry = await resumeService.createImprovedResume(
      req.supabaseClient,
      req.user.id,
      finalImprovedResume,
      improvementResult.job as JobDesc
    );

    res.json(
      new ApiResponse(
        200,
        newImprovedResumeEntry,
        "Improved resume created successfully"
      )
    );
  }
);

const saveResume = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user || !req.supabaseClient) {
      throw new ApiError(
        401,
        "Authentication error or client not initialized."
      );
    }

    const { resumeData, resumeId, isOriginal = true } = req.body;
    if (!resumeData || Object.keys(resumeData).length === 0) {
      throw new ApiError(400, "Resume data is required");
    }

    const result = await resumeService.upsertResume(
      req.supabaseClient,
      req.user.id,
      resumeData,
      { resumeId, isOriginal }
    );

    res.status(200).json(
      new ApiResponse(
        200,
        {
          id: result.id,
          operation: result.updated ? "updated" : "created",
          isOriginal: result.isOriginal,
        },
        result.updated
          ? "Resume updated successfully"
          : "Resume created successfully"
      )
    );
  }
);

const getResumes = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user || !req.supabaseClient) {
      throw new ApiError(
        401,
        "Authentication error or client not initialized."
      );
    }

    const resumes = await resumeService.getUserResumes(
      req.supabaseClient,
      req.user.id
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { count: resumes.length, resumes },
          "Resumes retrieved successfully"
        )
      );
  }
);

const deleteResume = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user || !req.supabaseClient) {
      throw new ApiError(
        401,
        "Authentication error or client not initialized."
      );
    }

    const { resumeId } = req.params;
    await resumeService.deleteResume(req.supabaseClient, req.user.id, resumeId);

    res
      .status(200)
      .json(
        new ApiResponse(200, { success: true }, "Resume deleted successfully")
      );
  }
);

export {
  parseResume,
  getParseResumeStatus,
  generateResumePdf,
  getPdfGenerationStatus, // ✅ NEW: Export the new status endpoint
  getResume,
  improveResume,
  saveResume,
  getResumes,
  deleteResume,
};
