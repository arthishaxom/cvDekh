import { Queue, QueueOptions } from "bullmq"; // Removed Worker as it's not used here
import IORedis from "ioredis";
import { logger } from "../server";

// Redis connection - you'll need Redis running
// Ensure your .env file has REDIS_HOST and REDIS_PORT or update defaults
const redisConnection = new IORedis({
  host: process.env.REDIS_HOST || "localhost",
  password: process.env.REDIS_PASSWORD,
  port: parseInt(process.env.REDIS_PORT || "6379"),
  username: process.env.REDIS_USERNAME || "default",
  maxRetriesPerRequest: 3, // BullMQ recommends not setting this too high
  // It's good practice to enable lazyConnect for BullMQ
  // so it doesn't connect until a queue/worker needs it.
  lazyConnect: true,
});

// Queue options with sensible defaults
const queueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: {
      count: 10, // Keep last 100 completed jobs
    },
    removeOnFail: {
      count: 50, // Keep last 500 failed jobs
    },
    attempts: 3, // Retry failed jobs up to 3 times
    backoff: {
      type: "exponential",
      delay: 5000, // Start with 5 second delay
    },
  },
};

// Create our resume parsing queue
export const resumeQueue = new Queue("resume-parsing", queueOptions);

// It's good practice to handle connection errors for the queue's Redis client
resumeQueue.on("error", (err) => {
  logger.error("BullMQ Queue Error:", err);
});

// Graceful shutdown for the queue connection
export const closeResumeQueue = async () => {
  await resumeQueue.close();
  // also close the IORedis connection if it's not shared by BullMQ workers in the same process
  // If workers are in separate processes, they'll manage their own connections.
  // await redisConnection.quit(); // or .disconnect()
  logger.info("BullMQ resumeQueue closed.");
};
