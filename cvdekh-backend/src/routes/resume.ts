import multer from "multer";
import express from "express";
import pdfParse from "pdf-parse";
import { GoogleGenAI, Type } from "@google/genai";
import systemInstructions from "../utils/prompts";
import "dotenv/config";
import pdfPrinter from "pdfmake";
import type { TDocumentDefinitions } from "pdfmake/interfaces"; // Or try 'pdfmake' if this path doesn't work
import { generateResumePdf } from "../utils/pdfResumeGenerator";
import { auth } from "../auth";
import { fromNodeHeaders } from "better-auth/node";

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

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

router.post("/parse-resume", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    const pdfData = req.file.buffer;
    const pdf = await pdfParse(pdfData);
    const pdfText = pdf.text;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: pdfText,
      config: {
        temperature: 0.1,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
        systemInstruction: systemInstructions["resume-parser"],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            summary: { type: Type.STRING },
            contactInfo: {
              type: Type.OBJECT,
              properties: {
                linkedin: { type: Type.STRING },
                github: { type: Type.STRING },
                gmail: { type: Type.STRING },
                phone: { type: Type.STRING },
              },
              propertyOrdering: ["linkedin", "github", "gmail", "phone"],
            },
            skills: {
              type: Type.OBJECT,
              properties: {
                languages: { type: Type.ARRAY, items: { type: Type.STRING } },
                frameworks: { type: Type.ARRAY, items: { type: Type.STRING } },
                others: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              propertyOrdering: ["languages", "frameworks", "others"],
            },
            education: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  institution: { type: Type.STRING },
                  field: { type: Type.STRING },
                  startDate: { type: Type.STRING },
                  endDate: { type: Type.STRING },
                  cgpa: { type: Type.STRING },
                },
                propertyOrdering: [
                  "institution",
                  "field",
                  "startDate",
                  "endDate",
                  "cgpa",
                ],
              },
            },
            projects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  techStack: { type: Type.ARRAY, items: { type: Type.STRING } },
                  details: { type: Type.ARRAY, items: { type: Type.STRING } },
                  startDate: { type: Type.STRING },
                  endDate: { type: Type.STRING },
                },
                propertyOrdering: [
                  "title",
                  "techStack",
                  "details",
                  "startDate",
                  "endDate",
                ],
              },
            },
            experience: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  jobTitle: { type: Type.STRING },
                  company: { type: Type.STRING },
                  startDate: { type: Type.STRING },
                  endDate: { type: Type.STRING },
                  details: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                propertyOrdering: [
                  "jobTitle",
                  "company",
                  "startDate",
                  "endDate",
                  "details",
                ],
              },
            },
          },
          propertyOrdering: [
            "name",
            "summary",
            "contactInfo",
            "skills",
            "education",
            "projects",
            "experience",
          ],
        },
      },
    });
    res.json(JSON.parse(response.text!)); // Send the parsed text as a response
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/generate-resume", express.json(), async (req, res) => {
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
