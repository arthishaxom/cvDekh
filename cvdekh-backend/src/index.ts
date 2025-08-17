import "dotenv/config";
import app from "./app";
import { closeResumeQueue } from "./config/bullmq.config";
import { closeRedis, initializeRedis } from "./config/redis.config";
import { closeResumeWorker } from "./workers/parser.worker";
import "./workers/pdf.worker";
import logger from "./config/logger.config";

const port = process.env.PORT || 8080;

const startServer = async () => {
  try {
    logger.info("🚀 Starting cvDekh Server...");
    logger.info("📡 Connecting to general Redis...");
    await initializeRedis();

    logger.info("⚙️ BullMQ Resume Worker initialized.");
    logger.info("⚙️ BullMQ Resume Queue initialized (from bullmq-config.ts).");

    const server = app.listen(port, () => {
      logger.info(`✅ cvDekh Server listening on port ${port}`);
      logger.info(`🌐 Health check: http://localhost:${port}/api/ok`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      logger.info(`\n${signal} received, shutting down gracefully...`);

      // Close BullMQ worker and queue
      logger.info("⚙️ Closing BullMQ Worker...");
      await closeResumeWorker();
      logger.info("⚙️ Closing BullMQ Queue...");
      await closeResumeQueue();

      // Close general Redis connection
      logger.info("📡 Closing general Redis connection...");
      await closeRedis();

      // Close Express server
      server.close(() => {
        logger.info("✅ Server closed successfully");
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error("❌ Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    // Listen for termination signals
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    logger.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
