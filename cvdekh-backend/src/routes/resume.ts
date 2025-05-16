import multer from "multer";
import express from "express";
import pdfParse from "pdf-parse";
import { GoogleGenAI, Type } from "@google/genai";
import systemInstructions from "../utils/prompts";
import dotenv from "dotenv";
dotenv.config();

const upload = multer({
  storage: multer.memoryStorage(),
});

const router = express.Router();

const ai = new GoogleGenAI({
  apiKey: "AIzaSyCNI8k_I7b2uwistQz5_pwGojogTlmvW64",
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

export default router;
