import z from "zod";

export interface ProjectEntry {
  title: string;
  techStack: string[];
  details: string[];
  startDate: string;
  endDate: string;
}

export const ProjectSchema = z.object({
  title: z.string(),
  techStack: z.array(z.string()),
  details: z.array(z.string()),
  startDate: z.string(),
  endDate: z.string(),
});
