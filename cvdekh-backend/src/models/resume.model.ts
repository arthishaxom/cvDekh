import z from "zod";
import { type EducationEntry, EducationSchema } from "./education.model";
import { type ExperienceEntry, ExperienceSchema } from "./experience.model";
import { type ProjectEntry, ProjectSchema } from "./project.model";

export interface ResumeData {
  id?: string;
  name: string;
  summary: string;
  contactInfo: {
    linkedin: string;
    github: string;
    gmail: string;
    phone: string;
  };
  skills: {
    languages: string[];
    frameworks: string[];
    others: string[];
  };
  education: EducationEntry[];
  projects: ProjectEntry[];
  experience: ExperienceEntry[];
}

export const ResumeDataSchema = z.object({
  name: z.string(),
  summary: z.string(),
  contactInfo: z.object({
    linkedin: z.string(),
    github: z.string(),
    gmail: z.string(),
    phone: z.string(),
  }),
  skills: z.object({
    languages: z.array(z.string()),
    frameworks: z.array(z.string()),
    others: z.array(z.string()),
  }),
  education: z.array(EducationSchema),
  projects: z.array(ProjectSchema),
  experience: z.array(ExperienceSchema),
});
