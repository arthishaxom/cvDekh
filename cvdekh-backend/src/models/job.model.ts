import z from "zod";

export interface JobDesc {
  type: string;
  skills: string[];
  company: string;
  stipend: string;
  jobTitle: string;
  location: string;
  matchScore: number;
  improvementsORSuggestions: string[];
}

export const JobDescSchema = z.object({
  type: z.string(),
  skills: z.array(z.string()),
  company: z.string(),
  stipend: z.string(),
  jobTitle: z.string(),
  location: z.string(),
  matchScore: z.number(),
  improvementsORSuggestions: z.array(z.string()),
});
