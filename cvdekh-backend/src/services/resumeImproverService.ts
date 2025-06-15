import { AIService, ParsedResumeData } from "../lib/aiService";
import { GeminiService } from "../lib/geminiService";
import { logger } from "../server";

export class ResumeImproverService {
  private aiService: AIService;

  constructor(aiService?: AIService) {
    // Default to Gemini, but allow injection of other AI services
    this.aiService = aiService || new GeminiService();
  }

  async improveResume(
    resumeData: ParsedResumeData,
    jobDescription: string,
  ): Promise<any> {
    // You might want to define a more specific return type
    try {
      if (!this.aiService.improveResume) {
        throw new Error(
          "The configured AI service does not support resume improvement.",
        );
      }
      const improvedResume = await this.aiService.improveResume(
        resumeData,
        jobDescription,
      );
      return improvedResume;
    } catch (error) {
      logger.error(
        new Error(
          `Failed to improve resume: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        ),
      );
    }
  }

  // Method to switch AI service at runtime if needed
  setAIService(aiService: AIService): void {
    this.aiService = aiService;
  }
}

// Export a default instance
export const resumeImproverService = new ResumeImproverService();
