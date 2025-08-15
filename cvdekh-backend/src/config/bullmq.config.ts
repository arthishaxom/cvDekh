import { Queue, type QueueOptions } from "bullmq"; // Removed Worker as it's not used here
import IORedis from "ioredis";
import { logger } from "..";

const redisConnection = new IORedis({
  host: process.env.REDIS_HOST || "localhost",
  password: process.env.REDIS_PASSWORD,
  port: parseInt(process.env.REDIS_PORT || "6379"),
  username: process.env.REDIS_USERNAME || "default",
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

const queueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: {
      count: 10,
    },
    removeOnFail: {
      count: 50,
    },
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
};

export const resumeQueue = new Queue("resume-parsing", queueOptions);

export const pdfQueue = new Queue("pdf-generation", queueOptions);

resumeQueue.on("error", (err) => {
  logger.error("BullMQ Queue Error:", err);
});

pdfQueue.on("error", (err) => {
  logger.error("BullMQ PDF Queue Error:", err);
});

export const closeResumeQueue = async () => {
  await resumeQueue.close();
  logger.info("BullMQ resumeQueue closed.");
};

export const closePdfQueue = async () => {
  await pdfQueue.close();
  logger.info("BullMQ pdfQueue closed.");
};

// Close all queues and Redis connection
export const closeAllQueues = async () => {
  await resumeQueue.close();
  await pdfQueue.close();
  await redisConnection.quit();
  logger.info("All BullMQ queues and Redis connection closed.");
};