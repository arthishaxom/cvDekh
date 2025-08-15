import { z } from "zod";

export interface CertificateEntry {
  name: string;
  company: string;
  issueDate: string;
}

export const CertificateSchema = z.object({
  name: z.string(),
  company: z.string(),
  issueDate: z.string(),
});
