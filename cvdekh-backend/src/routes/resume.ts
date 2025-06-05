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
  insertImprovedResume, // Add this import
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

      console.log("Resume Data:", resumeData); // Log the resume data to check its structure and nul

      if (!resumeData) {
        res.status(404).json({ message: "No resume data found" });
        return;
      }

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
            console.log(
              "PDF generated successfully, size:",
              finalBuffer.length,
              "bytes",
            );
            resolve(finalBuffer);
          });

          // Handle errors
          pdfDoc.on("error", (error: Error) => {
            console.error("PDF generation error:", error);
            reject(error);
          });

          // CRITICAL: End the document to start the generation process
          pdfDoc.end();
        } catch (error) {
          console.error("Error setting up PDF generation:", error);
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
        console.error("Supabase storage upload error:", uploadError);
        throw uploadError;
      }

      // Get public URL (or signed URL for more security)
      const { data: urlData } = req.supabaseClient.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      if (!urlData || !urlData.publicUrl) {
        console.error("Error getting public URL from Supabase storage");
        res.status(500).json({ message: "Error retrieving PDF URL" });
        return;
      }

      res.status(200).json({ pdfUrl: urlData.publicUrl });
    } catch (error) {
      console.error("Error in /generate-resume:", error);
      res
        .status(500)
        .json({ message: "Error generating or uploading resume PDF" });
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
