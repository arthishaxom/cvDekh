import { z } from "zod";

export const projectSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Project title is required"),
  techStack: z.array(z.string()).min(1, "At least one technology is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  details: z.array(z.string()).min(1, "Project details are required"),
});

export const projectsSchema = z.array(projectSchema);

export type ProjectFormData = z.infer<typeof projectSchema>;
