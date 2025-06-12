import { createClient } from "redis";
import "dotenv/config";
import { logger } from "../server";

const redisClient = createClient({
  username: process.env.REDIS_USERNAME || "default",
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
  },
});

redisClient.on("connect", () => {
  logger.info("✅ Connected to Redis");
});

redisClient.on("error", (error) => {
  logger.error("❌ Redis connection error:", error);
});

redisClient.on("ready", () => {
  logger.info("🚀 Redis is ready to accept commands");
});

export const initializeRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      logger.info("Redis connection established successfully");
    }
  } catch (error) {
    logger.error("Failed to connect to Redis:", error);
    // Don't throw error - allow app to continue without Redis
    // This is called "graceful degradation"
  }
};

// Function to safely close Redis connection
export const closeRedis = async () => {
  try {
    if (redisClient.isOpen) {
      await redisClient.close();
      logger.info("Redis connection closed");
    }
  } catch (error) {
    logger.error("Error closing Redis connection:", error);
  }
};

export default redisClient;
