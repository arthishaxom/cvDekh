import multer from "multer";
import express from "express";
import { resumeParserService } from "../utils/resumeParserService";
import { generateResumePdf } from "../utils/pdfResumeGenerator";
import pdfPrinter from "pdfmake";
import type { TDocumentDefinitions } from "pdfmake/interfaces";
// Remove: import { supabase } from "../lib/supabaseClient"; // No longer need global client here for this route
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import {
  getOriginalResume,
  getResumeById,
  getUserResumes,
  upsertOriginalResume,
} from "../utils/resumeUtils";
import { resumeImproverService } from "../utils/resumeImproverService"; // Import the new service
import { ParsedResumeData } from "../lib/aiService"; // Import ParsedResumeData if not already

var fonts = {
  Roboto: {
    normal: "fonts/cmun-Regular.ttf",
    bold: "fonts/cmun-Medium.ttf",
    italics: "fonts/cmun-Italic.ttf",
    bolditalics: "fonts/cmun-MediumItalic.ttf",
  },
};

// Initialize pdfMake with fonts
var pdfMake = new pdfPrinter(fonts);

const upload = multer({
  storage: multer.memoryStorage(),
});

const router = express.Router();

router.post(
  "/parse-resume",
  upload.single("resume"),
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ message: "No file uploaded" });
        return;
      }
      if (!req.user || !req.supabaseClient) {
        // Check if user and supabaseClient are populated
        res
          .status(401)
          .json({ message: "Authentication error or client not initialized." });
        return;
      }

      const parsedData = await resumeParserService.parseResumeFromBuffer(
        req.file.buffer,
      );

      await upsertOriginalResume(req.supabaseClient, req.user!.id, parsedData);
      res.json(parsedData);
    } catch (error) {
      console.error("Resume parsing error:", error);
      res.status(500).json({
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

router.post(
  "/generate-resume",
  express.json(),
  async (req: AuthenticatedRequest, res) => {
    // req.user will be available here if needed, populated by authMiddleware

    if (!req.user || !req.supabaseClient) {
      res
        .status(401)
        .json({ message: "Authentication error or client not initialized." });
      return;
    }

    try {
      let resumeData;
      const { resumeId, ...bodyData } = req.body;

      if (resumeId) {
        // Get resume data using the resumeId
        resumeData = await getResumeById(
          req.supabaseClient,
          resumeId,
          req.user!.id,
        );
      } else {
        // Get original resume data
        resumeData = await getOriginalResume(req.supabaseClient, req.user!.id);
      }

      // If no resume data found, fall back to request body data
      if (!resumeData && Object.keys(bodyData).length > 0) {
        resumeData = bodyData;
      }

      if (!resumeData) {
        res.status(404).json({ message: "No resume data found" });
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${resumeData.name.replace(
          /\s+/g,
          "",
        )}_Resume.pdf`,
      );

      // Use the utility function
      const pdfDoc = generateResumePdf(resumeData);
      pdfDoc.pipe(res);
      pdfDoc.end();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error generating resume" });
    }
  },
);

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
    console.error("Resume parsing error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

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

    // console.log("Original Resume Data:", originalResumeData);

    const filteredResumeData = {
      summary: originalResumeData.summary,
      projects: originalResumeData.projects,
    };

    // 2. Improve the resume using the new service
    //    You might need to cast originalResumeData to ParsedResumeData if its type is different
    //    For example, if getOriginalResume returns a generic object:
    const improvedResume = await resumeImproverService.improveResume(
      filteredResumeData as ParsedResumeData, // Adjust type as necessary
      job_desc,
    );

    res.json(improvedResume); // Send the improved resume as JSON response
  } catch (error) {
    console.error("Error in /improve-resume route:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.post(
  "/save-resume",
  express.json(),
  async (req: AuthenticatedRequest, res) => {
    // req.user will be available here if needed, populated by authMiddleware
    try {
      if (!req.user || !req.supabaseClient) {
        res
          .status(401)
          .json({ message: "Authentication error or client not initialized." });
        return;
      }

      const resumeData = req.body;

      // Validate that we have resume data
      if (!resumeData || Object.keys(resumeData).length === 0) {
        res.status(400).json({ message: "Resume data is required" });
        return;
      }

      // Use the upsert function to save/update the resume
      const result = await upsertOriginalResume(
        req.supabaseClient,
        req.user!.id,
        resumeData,
      );

      // Return success response with operation details
      res.status(200).json({
        success: true,
        message: result.updated
          ? "Resume updated successfully"
          : "Resume created successfully",
        id: result.id,
        operation: result.updated ? "updated" : "created",
      });
    } catch (error) {
      console.error("Error saving resume:", error);

      // Handle specific database errors if needed
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
    console.error("Error fetching user resumes:", error);

    // Extract error message safely
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    res.status(500).json({
      message: "Error fetching resumes",
      error: process.env.NODE_ENV === "development" ? errorMessage : undefined,
    });
  }
});

export default router;
