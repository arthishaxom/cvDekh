import multer from "multer";
import express from "express";
import { resumeParserService } from "../utils/resumeParserService";
import { generateResumePdf } from "../utils/pdfResumeGenerator";
import pdfPrinter from "pdfmake";
import type { TDocumentDefinitions } from "pdfmake/interfaces";

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

router.post("/parse-resume", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    // Use the modularized service
    const parsedData = await resumeParserService.parseResumeFromBuffer(req.file.buffer);
    
    res.json(parsedData);
  } catch (error) {
    console.error("Resume parsing error:", error);
    res.status(500).json({ 
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

router.post("/generate-resume", express.json(), async (req, res) => {
  // req.user will be available here if needed, populated by authMiddleware
  try {
    const resumeData = req.body;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${resumeData.name.replace(/\s+/g, "")}_Resume.pdf`,
    );

    // Use the utility function
    const pdfDoc = generateResumePdf(resumeData);
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error generating resume" });
  }
});

export default router;
