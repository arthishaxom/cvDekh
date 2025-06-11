import { Worker, Job } from "bullmq";
import fs from "fs/promises";
// import path from 'path'; // Not strictly needed here but good for path manipulations
import { resumeQueue, closeResumeQueue } from "../config/bullmq-config"; // Import queue and its closer
import { ResumeParserService } from "../utils/resumeParserService"; // Corrected path assuming utils is at src/utils
import { createClient, SupabaseClient } from "@supabase/supabase-js"; // Import SupabaseClient type
import { upsertResume } from "../utils/resumeUtils"; // Corrected path
import IORedis from "ioredis"; // For worker's Redis connection
import { GeminiService } from "../lib/geminiService"; // Assuming GeminiService is your AI service

interface ResumeParsingJobData {
  userId: string;
  filePath: string;
  originalName: string;
  userToken: string; // Added to receive the user's JWT
}

// Redis connection for the worker (BullMQ best practice: each worker has its own connection)
const workerRedisConnection = new IORedis({
  host: process.env.REDIS_HOST || "localhost",
  password: process.env.REDIS_PASSWORD,
  port: parseInt(process.env.REDIS_PORT || "6379"),
  maxRetriesPerRequest: null, // BullMQ handles retries at the job level
  enableReadyCheck: false, // Recommended by BullMQ
  lazyConnect: true,
});

workerRedisConnection.on("error", (err) => {
  console.error("Worker Redis Connection Error:", err);
});

// Create worker
const resumeWorker = new Worker<ResumeParsingJobData>(
  resumeQueue.name, // Use queue name for clarity
  async (job: Job<ResumeParsingJobData>) => {
    await job.updateProgress(10);
    const { userId, filePath, originalName, userToken } = job.data;
    let supabaseClient: SupabaseClient | null = null; // Initialize to null

    console.log(
      `[Worker Job ${job.id}] Starting processing for user ${userId}, file: ${originalName}`,
    );

    try {
      await job.updateProgress(5);
      console.log(`[Worker Job ${job.id}] Progress: 5% - Initialized`);

      // Create a Supabase client instance for this job using the user's token
      // This ensures operations are performed in the context of the user
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseAnonKey = process.env.SUPABASE_ANON;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
          "Supabase URL or Anon Key is not defined in environment variables.",
        );
      }

      supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${userToken}` } },
      });
      console.log(`[Worker Job ${job.id}] Supabase client created for user.`);
      await job.updateProgress(10);

      const fileBuffer = await fs.readFile(filePath);
      console.log(`[Worker Job ${job.id}] File read from ${filePath}`);
      await job.updateProgress(20);

      // Initialize your AI service (e.g., GeminiService)
      const aiService = new GeminiService(); // Or however you instantiate your AIService
      const resumeParser = new ResumeParserService(aiService); // Pass AI service if constructor expects it
      const parsedData = await resumeParser.parseResumeFromBuffer(fileBuffer);
      console.log(`[Worker Job ${job.id}] Resume parsed successfully.`);
      await job.updateProgress(70);

      if (!supabaseClient) {
        // Should not happen if initialized above
        throw new Error(
          "Supabase client not initialized for database operation.",
        );
      }

      await upsertResume(supabaseClient, userId, parsedData, {
        isOriginal: true, // Assuming this is for the original resume
      });
      console.log(`[Worker Job ${job.id}] Parsed data upserted to database.`);
      await job.updateProgress(90);

      // Clean up temporary file
      await fs.unlink(filePath);
      console.log(`[Worker Job ${job.id}] Temporary file ${filePath} deleted.`);
      await job.updateProgress(100);

      console.log(`[Worker Job ${job.id}] Processing completed successfully.`);
      return parsedData; // This will be stored in job.returnvalue
    } catch (error: any) {
      console.error(
        `[Worker Job ${job.id}] Error during processing:`,
        error.message,
        error.stack,
      );
      // Clean up file even if processing fails
      try {
        await fs.unlink(filePath);
        console.log(
          `[Worker Job ${job.id}] Temporary file ${filePath} deleted after error.`,
        );
      } catch (cleanupError: any) {
        console.error(
          `[Worker Job ${job.id}] Error cleaning up file ${filePath} after error:`,
          cleanupError.message,
        );
      }

      throw error; // Re-throw to mark job as failed, BullMQ will use error.message as failedReason
    }
  },
  {
    connection: workerRedisConnection,
    concurrency: parseInt(process.env.RESUME_WORKER_CONCURRENCY || "3"), // Process up to N jobs simultaneously
    // Remove removeOnComplete and removeOnFail from worker options, they are set on the Queue.
  },
);

// Handle worker events
resumeWorker.on("completed", (job, result) => {
  console.log(
    `Job ${job.id} completed successfully. Result:`,
    result ? "has result" : "no result",
  );
});

resumeWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed with error: "${err.message}"`);
});

resumeWorker.on("error", (err) => {
  console.error("Resume Worker encountered an error:", err);
});

resumeWorker.on("active", (job) => {
  console.log(`Job ${job.id} has started.`);
});

resumeWorker.on("progress", (job, progress) => {
  console.log(`Job ${job.id} reported progress: ${progress}%`);
});

console.log("Resume parsing worker started and listening for jobs...");

// Graceful shutdown for the worker and its Redis connection
export const closeResumeWorker = async () => {
  await resumeWorker.close();
  await workerRedisConnection.quit(); // or .disconnect()
  console.log("BullMQ resumeWorker closed.");
};

export { resumeWorker }; // Export the worker instance if needed elsewhere (e.g. for health checks)
