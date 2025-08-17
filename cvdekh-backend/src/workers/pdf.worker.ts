import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { type Job, Worker } from "bullmq";
import IORedis from "ioredis";
import { pdfQueue } from "../config/bullmq.config";
import logger from "../config/logger.config";
import type { ResumeData } from "../models/resume.model";
import { resumeService } from "../services/resume.service";
import {
  generateResumePdfUtil,
  validateTypstInstallation,
} from "../utils/pdfGenerator";

interface PdfGenerationJobData {
  userId: string;
  resumeId?: string;
  userToken: string;
}

// Redis connection for the worker
const workerRedisConnection = new IORedis({
  host: process.env.REDIS_HOST || "localhost",
  password: process.env.REDIS_PASSWORD,
  port: parseInt(process.env.REDIS_PORT || "6379"),
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
});

workerRedisConnection.on("error", (err) => {
  logger.error("PDF Worker Redis Connection Error:", err);
});

// Validate Typst installation on worker startup
validateTypstInstallation().then((isValid) => {
  if (!isValid) {
    logger.error(
      "Typst CLI is not installed or not accessible. PDF generation will fail."
    );
  } else {
    logger.info("Typst CLI validation successful.");
  }
});

// Create worker
const pdfWorker = new Worker<PdfGenerationJobData>(
  pdfQueue.name,
  async (job: Job<PdfGenerationJobData>) => {
    const { userId, resumeId, userToken } = job.data;
    let supabaseClient: SupabaseClient | null = null;

    try {
      await job.updateProgress(5);

      // Initialize Supabase client
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseAnonKey = process.env.SUPABASE_ANON;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
          "Supabase URL or Anon Key is not defined in environment variables."
        );
      }

      supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${userToken}` } },
      });

      await job.updateProgress(10);

      // Get resume data
      const resumeData: ResumeData | null = resumeId
        ? await resumeService.getResumeById(supabaseClient, resumeId, userId)
        : await resumeService.getOriginalResume(supabaseClient, userId);

      if (!resumeData) {
        throw new Error("No resume data found");
      }

      await job.updateProgress(20);

      // Cleanup old user files
      await resumeService.cleanupUserFiles(
        supabaseClient,
        userId,
        "generated-resumes"
      );

      await job.updateProgress(30);

      // Generate PDF using Typst CLI
      logger.info(
        `[Worker Job ${job.id}] Generating PDF for user ${userId} using Typst CLI`
      );

      // ✅ UPDATED: Use the new PDF generator utility without options
      const pdfBuffer = await generateResumePdfUtil(resumeData);

      logger.info(
        `[Worker Job ${job.id}] PDF generated successfully using Typst, buffer size: ${pdfBuffer.length} bytes`
      );

      await job.updateProgress(60);

      // Create safe filename
      const safeName = resumeData.name
        ? resumeData.name.replace(/[^a-zA-Z0-9]/g, "")
        : "resume";

      const fileName = `${userId}/${safeName}_${Date.now()}.pdf`;
      const bucketName = "generated-resumes";

      // Upload to Supabase Storage
      const { error: uploadError } = await supabaseClient.storage
        .from(bucketName)
        .upload(fileName, pdfBuffer, {
          contentType: "application/pdf",
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        logger.error(
          `[Worker Job ${job.id}] Supabase storage upload error:`,
          uploadError
        );
        throw new Error(
          `Error uploading PDF to storage: ${uploadError.message}`
        );
      }

      await job.updateProgress(80);

      // Get public URL
      const { data: urlData } = supabaseClient.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      if (!urlData || !urlData.publicUrl) {
        logger.error(
          `[Worker Job ${job.id}] Error getting public URL from Supabase storage`
        );
        throw new Error("Error retrieving PDF URL");
      }

      await job.updateProgress(100);

      logger.info(
        `[Worker Job ${job.id}] PDF generation completed using Typst: ${urlData.publicUrl}`
      );

      return {
        pdfUrl: urlData.publicUrl,
        fileName: fileName,
        generatedAt: new Date().toISOString(),
        generator: "typst", // ✅ ADDED: Track which generator was used
      };
    } catch (error: unknown) {
      logger.error(
        `[Worker Job ${job.id}] Error during PDF generation with Typst:`,
        error instanceof Error ? error.message : String(error)
      );

      // ✅ ADDED: More specific error handling for Typst-related issues
      if (error instanceof Error && error.message.includes("typst")) {
        logger.error(
          `[Worker Job ${job.id}] Typst-specific error. Check if Typst CLI is installed and accessible.`
        );
      }

      throw error;
    }
  },
  {
    connection: workerRedisConnection,
    concurrency: parseInt(process.env.PDF_WORKER_CONCURRENCY || "2"),
  }
);

// ✅ ADDED: Worker event handlers for better monitoring
pdfWorker.on("completed", (job) => {
  logger.info(
    `[Worker Job ${job.id}] PDF generation job completed successfully`
  );
});

pdfWorker.on("failed", (job, err) => {
  logger.error(
    `[Worker Job ${job?.id}] PDF generation job failed:`,
    err.message
  );
});

pdfWorker.on("stalled", (jobId) => {
  logger.warn(`[Worker Job ${jobId}] PDF generation job stalled`);
});

// Graceful shutdown
export const closePdfWorker = async () => {
  await pdfWorker.close();
  await workerRedisConnection.quit();
  logger.info("BullMQ pdfWorker closed.");
};

export { pdfWorker };
