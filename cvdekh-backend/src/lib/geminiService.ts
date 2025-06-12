import { GoogleGenAI, Type } from "@google/genai";
import { AIService, ParsedResumeData } from "./aiService";
import systemInstructions from "../utils/prompts";
import "dotenv/config";

export class GeminiService implements AIService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });
  }

  async parseResume(resumeText: string): Promise<ParsedResumeData> {
    const response = await this.ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: resumeText,
      config: {
        temperature: 0.1,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
        systemInstruction: systemInstructions["resume-parser"],
        responseMimeType: "application/json",
        responseSchema: this.getResumeSchema(),
      },
    });

    return JSON.parse(response.text!, (key, value) => {
      if (value === "null") {
        return null;
      }
      return value;
    });
  }

  async improveResume(resumeData: ParsedResumeData, jobDescription: string) {
    const content = `
Resume: ${JSON.stringify(resumeData)}
Job Description: ${jobDescription}
`;

    const response = await this.ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: content,
      config: {
        temperature: 0.1,
        // topK: 1,
        // topP: 1,
        maxOutputTokens: 2048,
        systemInstruction: systemInstructions["resume-improver"],
        responseMimeType: "application/json",
        // responseSchema: this.getImpovedResumeSchema(),
      },
    });

    return JSON.parse(response.text!, (key, value) => {
      if (value === "null") {
        return null;
      }
      return value;
    });
  }

  private getResumeSchema() {
    return {
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
    };
  }

  private getImpovedResumeSchema() {
    return {
      type: Type.OBJECT,
      properties: {
        resume: {
          type: Type.OBJECT,
          properties: {
            // summary: {
            //   type: Type.STRING,
            // },
            skills: {
              type: Type.OBJECT,
              properties: {
                languages: { type: Type.ARRAY, items: { type: Type.STRING } },
                frameworks: { type: Type.ARRAY, items: { type: Type.STRING } },
                others: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              propertyOrdering: ["languages", "frameworks", "others"],
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
          },
        },
        job: {
          type: Type.OBJECT,
          properties: {
            jobTitle: {
              type: Type.STRING,
            },
            company: {
              type: Type.STRING,
            },
            location: {
              type: Type.STRING,
            },
            eligibility: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            skills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            stipend: {
              type: Type.STRING,
            },
          },
        },
      },
    };
  }
}
