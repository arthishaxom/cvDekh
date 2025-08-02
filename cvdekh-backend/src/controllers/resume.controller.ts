import type { Job } from "bullmq";
import type { Response } from "express";
import { logger } from "..";
import { resumeQueue } from "../config/bullmq-config";
import type { JobDesc } from "../models/job.model";
import type { ResumeData } from "../models/resume.model";
import { aiService } from "../services/ai.service";
import { resumeService } from "../services/resume.service";
import type { AuthenticatedRequest } from "../types/auth.type";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { generateResumePdfUtil } from "../utils/pdfGenerator";

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
            data: returnValue,
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

const generateResumePdf = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user || !req.supabaseClient) {
      throw new ApiError(
        401,
        "Authentication error or client not initialized."
      );
    }

    let resumeData: ResumeData | null;
    const { resumeId } = req.body; // Only expect resumeId or nothing for original
    const userId = req.user.id;

    if (resumeId) {
      resumeData = await resumeService.getResumeById(
        req.supabaseClient,
        resumeId,
        userId
      );
    } else {
      resumeData = await resumeService.getOriginalResume(
        req.supabaseClient,
        userId
      );
    }

    if (!resumeData) {
      throw new ApiError(404, "No resume data found");
    }

    await resumeService.cleanupUserFiles(
      req.supabaseClient,
      userId,
      "generated-resumes"
    );

    // Generate PDF (assuming generateResumePdf returns a stream that can be converted to buffer)
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      try {
        // generateResumePdf returns a PDFKit document from pdfmake
        const pdfDoc = generateResumePdfUtil(resumeData);
        const chunks: Buffer[] = [];

        // Listen for data chunks
        pdfDoc.on("data", (chunk: Buffer) => {
          chunks.push(chunk);
        });

        // When the document is finished
        pdfDoc.on("end", () => {
          const finalBuffer = Buffer.concat(chunks);
          resolve(finalBuffer);
        });

        // Handle errors
        pdfDoc.on("error", (error: Error) => {
          logger.error("PDF generation error:", error);
          reject(new ApiError(500, "PDF generation error", [error.message]));
        });

        // CRITICAL: End the document to start the generation process
        pdfDoc.end();
      } catch (error: unknown) {
        logger.error("Error setting up PDF generation:", error);
        if (error instanceof Error) {
          reject(
            new ApiError(500, "Error setting up PDF generation", [
              error.message,
            ])
          );
        } else {
          reject(
            new ApiError(500, "Error setting up PDF generation", [
              "Unknown error",
            ])
          );
        }
      }
    });

    const safeName = resumeData.name
      ? resumeData.name.replace(/[^a-zA-Z0-9]/g, "")
      : "resume";
    // Use user-specific folder for better organization and security
    const fileName = `${userId}/${safeName}_${Date.now()}.pdf`;
    const bucketName = "generated-resumes";

    // Upload to Supabase Storage
    const { error: uploadError } = await req.supabaseClient.storage
      .from(bucketName)
      .upload(fileName, pdfBuffer, {
        contentType: "application/pdf",
        // upsert: true, // Overwrite if file with same name exists
      });

    if (uploadError) {
      logger.error("Supabase storage upload error:", uploadError);
      throw new ApiError(500, "Error uploading PDF to storage", [
        uploadError.message,
      ]);
    }

    // Get public URL (or signed URL for more security)
    const { data: urlData } = req.supabaseClient.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    if (!urlData || !urlData.publicUrl) {
      logger.error("Error getting public URL from Supabase storage");
      throw new ApiError(500, "Error retrieving PDF URL");
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { pdfUrl: urlData.publicUrl },
          "Resume PDF generated"
        )
      );
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
  getResume,
  improveResume,
  saveResume,
  getResumes,
  deleteResume,
};
