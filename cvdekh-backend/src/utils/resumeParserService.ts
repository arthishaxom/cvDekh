import pdfParse from "pdf-parse";
import { AIService, ParsedResumeData } from "../lib/aiService";
import { GeminiService } from "../lib/geminiService";

export class ResumeParserService {
  private aiService: AIService;

  constructor(aiService?: AIService) {
    // Default to Gemini, but allow injection of other AI services
    this.aiService = aiService || new GeminiService();
  }

  async parseResumeFromBuffer(fileBuffer: Buffer): Promise<ParsedResumeData> {
    try {
      // Extract text from PDF
      const pdf = await pdfParse(fileBuffer);
      const pdfText = pdf.text;

      if (!pdfText || pdfText.trim().length === 0) {
        throw new Error("No text content found in the PDF");
      }

      // Parse resume using AI service
      const parsedData = await this.aiService.parseResume(pdfText);

      return parsedData;
    } catch (error) {
      console.error("Error parsing resume:", error);
      throw new Error(
        `Failed to parse resume: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  // Method to switch AI service at runtime if needed
  setAIService(aiService: AIService): void {
    this.aiService = aiService;
  }
}

// Export a default instance
export const resumeParserService = new ResumeParserService();
