import multer from "multer";
import express from "express";
// Remove resumeParserService if it's no longer used directly in this file
// import { resumeParserService } from "../utils/resumeParserService";
import { generateResumePdf } from "../utils/pdfResumeGenerator";
import pdfPrinter from "pdfmake";
import type { TDocumentDefinitions } from "pdfmake/interfaces";
// Remove: import { supabase } from "../lib/supabaseClient"; // No longer need global client here for this route
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import {
  getOriginalResume,
  getResumeById,
  getUserResumes,
  insertImprovedResume,
  cleanupUserResumes,
  upsertResume,
  deleteResume,
} from "../utils/resumeUtils";
import { resumeImproverService } from "../utils/resumeImproverService";
import { ParsedResumeData } from "../lib/aiService";

// NEW: Import BullMQ queue and rate limiter
import rateLimit from "express-rate-limit";
import { resumeQueue } from "../config/bullmq-config"; // Adjusted path
import fs from "fs/promises"; // For creating temp-uploads directory
import path from "path"; // For path operations
import { logger } from "../server";

var fonts = {
  Roboto: {
    normal: "fonts/cmun-Regular.ttf",
    bold: "fonts/cmun-Medium.ttf",
    italics: "fonts/cmun-Italic.ttf",
    bolditalics: "fonts/cmun-MediumItalic.ttf",
  },
};

const tempUploadsDir = path.join(__dirname, "..", "..", "temp-uploads"); // Adjusted path to be relative to src

// Ensure temp-uploads directory exists
(async () => {
  try {
    await fs.mkdir(tempUploadsDir, { recursive: true });
    logger.info(`Temporary upload directory ensured at: ${tempUploadsDir}`);
  } catch (error) {
    logger.error("Failed to create temp-uploads directory:", error);
  }
})();

const upload = multer({
  dest: tempUploadsDir,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      // Pass an error to cb to reject the file
      cb(new Error("Only PDF files are allowed") as any, false);
    }
  },
});

const router = express.Router();

// NEW: Rate limiter for parse-resume
const parseResumeRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs (adjust as needed)
  message: {
    error: "Too many resume parsing requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

//! Endpoint to parse resume
router.post(
  "/parse-resume",
  parseResumeRateLimit, // Apply rate limiting
  upload.single("resume"),
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ message: "No file uploaded" });
        return;
      }

      if (!req.user || !req.supabaseClient) {
        res.status(401).json({
          message: "Authentication error or client not initialized.",
        });
        return;
      }

      // Instead of processing immediately, add job to queue
      const job = await resumeQueue.add("parse-resume", {
        userId: req.user.id,
        filePath: req.file.path, // File path instead of buffer
        originalName: req.file.originalname,
        // Pass the JWT token for the worker to create its own Supabase client
        userToken: req.headers.authorization?.split(" ")[1],
      });

      // Return job ID immediately - don't wait for processing
      res.status(202).json({
        // 202 Accepted is more appropriate here
        message: "Resume parsing job accepted",
        jobId: job.id,
      });
    } catch (error: any) {
      logger.error("Error in /parse-resume route:", error);
      // If multer error (e.g., file type)
      if (error.message === "Only PDF files are allowed") {
        res.status(400).json({ message: error.message });
        return;
      }
      res.status(500).json({
        message: "Internal server error while adding job to queue",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

//! Endpoint to check job status
router.get("/parse-resume/:jobId", async (req: AuthenticatedRequest, res) => {
  try {
    const { jobId } = req.params;
    const job = await resumeQueue.getJob(jobId);

    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    const state = await job.getState();
    const progress = job.progress;
    const returnValue = job.returnvalue;
    const failedReason = job.failedReason;

    if (state === "completed") {
      res.json({
        status: "completed",
        data: returnValue, // This will contain the parsedData from the worker
        progress: typeof progress === "number" ? progress : 100, // Ensure progress is a number
      });
    } else if (state === "failed") {
      res.status(500).json({
        // Send a 500 for failed jobs
        status: "failed",
        error: failedReason,
        progress: typeof progress === "number" ? progress : 0, // Ensure progress is a number
      });
    } else {
      res.json({
        status: state, // 'waiting', 'active', 'delayed', etc.
        progress: typeof progress === "number" ? progress : 0, // Ensure progress is a number
      });
    }
  } catch (error) {
    logger.error("Error checking job status:", error);
    res.status(500).json({ message: "Error checking job status" });
  }
});

//! Endpoint to generate PDF of resume
router.post(
  "/generate-resume",
  express.json(),
  async (req: AuthenticatedRequest, res) => {
    if (!req.user || !req.supabaseClient) {
      res
        .status(401)
        .json({ message: "Authentication error or client not initialized." });
      return;
    }

    try {
      let resumeData;
      const { resumeId } = req.body; // Only expect resumeId or nothing for original
      const userId = req.user.id;

      if (resumeId) {
        resumeData = await getResumeById(req.supabaseClient, resumeId, userId);
      } else {
        resumeData = await getOriginalResume(req.supabaseClient, userId);
      }

      if (!resumeData) {
        res.status(404).json({ message: "No resume data found" });
        return;
      }

      await cleanupUserResumes(req.supabaseClient, userId, "generated-resumes");

      // Generate PDF (assuming generateResumePdf returns a stream that can be converted to buffer)
      const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        try {
          // generateResumePdf returns a PDFKit document from pdfmake
          const pdfDoc = generateResumePdf(resumeData);
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
            reject(error);
          });

          // CRITICAL: End the document to start the generation process
          pdfDoc.end();
        } catch (error) {
          logger.error("Error setting up PDF generation:", error);
          reject(error);
        }
      });

      // const fileName = `${
      //   resumeData.name?.replace(/\s+/g, "") || "resume"
      // }_${Date.now()}.pdf`;
      // const bucketName = "generated-resumes"; // Make sure this bucket exists in your Supabase storage

      const safeName = resumeData.name
        ? resumeData.name.replace(/[^a-zA-Z0-9]/g, "")
        : "resume";
      // Use user-specific folder for better organization and security
      const fileName = `${userId}/${safeName}_${Date.now()}.pdf`;
      const bucketName = "generated-resumes";

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } =
        await req.supabaseClient.storage
          .from(bucketName)
          .upload(fileName, pdfBuffer, {
            contentType: "application/pdf",
            // upsert: true, // Overwrite if file with same name exists
          });

      if (uploadError) {
        logger.error("Supabase storage upload error:", uploadError);
        throw uploadError;
      }

      // Get public URL (or signed URL for more security)
      const { data: urlData } = req.supabaseClient.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      if (!urlData || !urlData.publicUrl) {
        logger.error("Error getting public URL from Supabase storage");
        res.status(500).json({ message: "Error retrieving PDF URL" });
        return;
      }

      res.status(200).json({ pdfUrl: urlData.publicUrl });
    } catch (error) {
      logger.error("Error in /generate-resume:", error);
      res
        .status(500)
        .json({ message: "Error generating or uploading resume PDF" });
    }
  },
);

//! Endpoint to get a resume
router.get("/get-resume", async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user || !req.supabaseClient) {
      // Check if user and supabaseClient are populated
      res
        .status(401)
        .json({ message: "Authentication error or client not initialized." });
      return;
    }

    const data = await getOriginalResume(req.supabaseClient, req.user!.id);
    res.json(data); // Send the data as JSON response
  } catch (error) {
    logger.error("Resume parsing error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

//! Endpoint to improve a resume
router.post("/improve-resume", async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user || !req.supabaseClient) {
      res
        .status(401)
        .json({ message: "Authentication error or client not initialized." });
      return;
    }

    const { job_desc } = req.body;

    if (!job_desc || typeof job_desc !== "string") {
      res
        .status(400)
        .json({ message: "Missing or invalid 'job_desc' in request body." });
      return;
    }

    // 1. Get the original resume data
    const originalResumeData: ParsedResumeData = await getOriginalResume(
      req.supabaseClient,
      req.user!.id,
    );

    if (!originalResumeData) {
      res.status(404).json({ message: "Original resume not found." });
      return;
    }

    const filteredResumeData = {
      summary: originalResumeData.summary,
      projects: originalResumeData.projects,
    };

    // 2. Improve the resume using the new service
    //    You might need to cast originalResumeData to ParsedResumeData if its type is different
    //    For example, if getOriginalResume returns a generic object:
    const improvementResult = await resumeImproverService.improveResume(
      filteredResumeData as ParsedResumeData, // Adjust type as necessary
      job_desc,
    );

    // Merge the improved parts (summary and projects) into the original resume data
    const finalImprovedResume = {
      ...originalResumeData,
      summary:
        improvementResult.improvedResume.summary || originalResumeData.summary,
      projects:
        improvementResult.improvedResume.projects ||
        originalResumeData.projects,
      // Retain other fields from originalResumeData like contact, education, experience, skills etc.
    };
    // The 'job' part from improvementResult is not directly part of the resume data to be saved,
    // but the job_desc string itself is saved with the resume via insertImprovedResume.

    // 3. Insert the improved resume into the database
    const newImprovedResumeEntry = await insertImprovedResume(
      req.supabaseClient,
      req.user!.id,
      finalImprovedResume, // Pass the merged resume data
      improvementResult.job, // Pass the original job_desc from the request
    );

    res.json(newImprovedResumeEntry); // Send the newly created resume entry as JSON response
  } catch (error) {
    logger.error("Error in /improve-resume route:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

//! Endpoint to save a resume
router.post(
  "/save-resume",
  express.json(),
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user || !req.supabaseClient) {
        res
          .status(401)
          .json({ message: "Authentication error or client not initialized." });
        return;
      }

      const { resumeData, resumeId, isOriginal = true } = req.body;

      // Validate that we have resume data
      if (!resumeData || Object.keys(resumeData).length === 0) {
        res.status(400).json({ message: "Resume data is required" });
        return;
      }

      // Use the enhanced upsert function
      const result = await upsertResume(
        req.supabaseClient,
        req.user!.id,
        resumeData,
        { resumeId, isOriginal },
      );

      // Return success response with operation details
      res.status(200).json({
        success: true,
        message: result.updated
          ? "Resume updated successfully"
          : "Resume created successfully",
        id: result.id,
        operation: result.updated ? "updated" : "created",
        isOriginal: result.isOriginal,
      });
    } catch (error) {
      logger.error("Error saving resume:", error);

      // Handle specific errors
      if (
        error instanceof Error &&
        error.message === "Resume not found or access denied"
      ) {
        res.status(404).json({
          message: "Resume not found or you don't have permission to edit it",
        });
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      res.status(500).json({
        message: "Error saving resume",
        error:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      });
    }
  },
);

//! Endpoint to get all resumes
router.get("/get-resumes", async (req: AuthenticatedRequest, res) => {
  if (!req.user || !req.supabaseClient) {
    // Check if user and supabaseClient are populated
    res
      .status(401)
      .json({ message: "Authentication error or client not initialized." });
    return;
  }
  // req.user will be available here if needed, populated by authMiddleware
  try {
    // Get all non-original resumes for the user
    const resumes = await getUserResumes(req.supabaseClient, req.user!.id);

    // Return success response with resumes
    res.status(200).json({
      success: true,
      message: "Resumes retrieved successfully",
      count: resumes.length,
      resumes: resumes,
    });
  } catch (error: unknown) {
    logger.error("Error fetching user resumes:", error);

    // Extract error message safely
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    res.status(500).json({
      message: "Error fetching resumes",
      error: process.env.NODE_ENV === "development" ? errorMessage : undefined,
    });
  }
});

//! Endpoint to delete a resume
router.delete(
  "/delete-resume/:resumeId",
  async (req: AuthenticatedRequest, res) => {
    if (!req.user || !req.supabaseClient) {
      // Check if user and supabaseClient are populated
      res
        .status(401)
        .json({ message: "Authentication error or client not initialized." });
      return;
    }
    const { resumeId } = req.params;

    // req.user will be available here if needed, populated by authMiddleware
    try {
      // Delete the resume
      await deleteResume(req.supabaseClient, req.user!.id, resumeId);

      // Return success response
      res.status(200).json({
        success: true,
        message: "Resume deleted successfully",
      });
    } catch (error: unknown) {
      logger.error("Error deleting resume:", error);

      // Extract error message safely
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      res.status(500).json({
        message: "Error deleting resume",
        error:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      });
    }
  },
);

export default router;
