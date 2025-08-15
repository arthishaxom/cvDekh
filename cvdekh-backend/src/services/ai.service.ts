import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import pdfParse from "pdf-parse";
import { logger } from "..";
import SYSTEM_INSTRUCTIONS from "../config/prompts.config";
import {
  type ImprovedResumeResponse,
  ImprovedResumeResponseSchema,
} from "../models/improved-resume.model";
import { type ResumeData, ResumeDataSchema } from "../models/resume.model";

class AIService {
  private model = google("gemini-2.0-flash");
  async parseResume(fileBuffer: Buffer): Promise<ResumeData> {
    try {
      const pdf = await pdfParse(fileBuffer);
      const pdfText = pdf.text;

      if (!pdfText || pdfText.trim().length === 0) {
        throw new Error("No text content found in the PDF");
      }

      const { object } = await generateObject({
        model: this.model,
        schema: ResumeDataSchema,
        prompt: `Parse this resume text and extract structured data: ${pdfText}`,
        system: SYSTEM_INSTRUCTIONS["resume-parser"],
        temperature: 0.1,
        maxOutputTokens: 2048,
      });

      return object;
    } catch (error) {
      logger.error("Resume parsing failed:", error);
      throw new Error("Failed to parse resume");
    }
  }

  async improveResume(
    resumeData: Partial<ResumeData>,
    jobDescription: string
  ): Promise<ImprovedResumeResponse> {
    try {
      const { object } = await generateObject({
        model: this.model,
        schema: ImprovedResumeResponseSchema,
        prompt: `Improve this resume for the job description:\n\nResume: ${JSON.stringify(
          resumeData
        )}\n\nJob Description: ${jobDescription}`,
        system: SYSTEM_INSTRUCTIONS["resume-improver"],
        temperature: 0.1,
        maxOutputTokens: 2048,
      });

      return object;
    } catch (error) {
      logger.error("Resume improvement failed:", error);
      throw new Error("Failed to improve resume");
    }
  }
}

export const aiService = new AIService();
