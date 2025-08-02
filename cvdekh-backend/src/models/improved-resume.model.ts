import z from "zod";
import { type JobDesc, JobDescSchema } from "./job.model";
import { type ProjectEntry, ProjectSchema } from "./project.model";

export interface ImprovedResumeResponse {
  improvedResume: {
    summary: string;
    skills: {
      languages: string[];
      frameworks: string[];
      others: string[];
    };
    projects: ProjectEntry[];
  };
  job: JobDesc;
}

export const ImprovedResumeResponseSchema = z.object({
  improvedResume: z.object({
    summary: z.string(),
    skills: z.object({
      languages: z.array(z.string()),
      frameworks: z.array(z.string()),
      others: z.array(z.string()),
    }),
    projects: z.array(ProjectSchema),
  }),
  job: JobDescSchema,
});
