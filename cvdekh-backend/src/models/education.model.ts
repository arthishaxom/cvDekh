import { z } from "zod";

export interface EducationEntry {
  institution: string;
  field: string;
  startDate: string;
  endDate: string;
  cgpa: string;
}

export const EducationSchema = z.object({
  institution: z.string(),
  field: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  cgpa: z.string(),
});
