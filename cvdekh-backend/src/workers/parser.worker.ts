import fs from "node:fs/promises";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { type Job, Worker } from "bullmq";
import IORedis from "ioredis";
import { logger } from "..";
import { resumeQueue } from "../config/bullmq.config";
import { aiService } from "../services/ai.service";
import { resumeService } from "../services/resume.service";

interface ResumeParsingJobData {
  userId: string;
  filePath: string;
  originalName: string;
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
  logger.error("Worker Redis Connection Error:", err);
});

// Create worker
const resumeWorker = new Worker<ResumeParsingJobData>(
  resumeQueue.name,
  async (job: Job<ResumeParsingJobData>) => {
    const { userId, filePath, originalName: _, userToken } = job.data;
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

      // Read file and parse resume
      const fileBuffer = await fs.readFile(filePath);
      await job.updateProgress(20);

      // Parse resume using AI service - much simpler!
      const parsedData = await aiService.parseResume(fileBuffer);
      await job.updateProgress(70);

      // Save to database
      await resumeService.upsertResume(supabaseClient, userId, parsedData, {
        isOriginal: true,
      });
      await job.updateProgress(90);

      // Clean up temporary file
      await fs.unlink(filePath);
      await job.updateProgress(100);

      return parsedData;
    } catch (error: unknown) {
      logger.error(
        `[Worker Job ${job.id}] Error during processing:`,
        error instanceof Error ? error.message : String(error)
      );

      try {
        await fs.unlink(filePath);
      } catch (cleanupError: unknown) {
        logger.error(
          `[Worker Job ${job.id}] Error cleaning up file ${filePath}:`,
          cleanupError instanceof Error
            ? cleanupError.message
            : String(cleanupError)
        );
      }

      throw error;
    }
  },
  {
    connection: workerRedisConnection,
    concurrency: parseInt(process.env.RESUME_WORKER_CONCURRENCY || "3"),
  }
);

// Graceful shutdown
export const closeResumeWorker = async () => {
  await resumeWorker.close();
  await workerRedisConnection.quit();
  logger.info("BullMQ resumeWorker closed.");
};

export { resumeWorker };
