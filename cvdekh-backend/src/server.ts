import express from "express";
import resumeRouter from "./routes/resume";
import "dotenv/config";
import {
  authMiddleware,
  AuthenticatedRequest,
} from "./middleware/authMiddleware";
import { closeRedis, initializeRedis } from "./config/redisClient"; // This is for your general app Redis, if different
import cors from "cors";
import winston from "winston";
import { Logtail } from "@logtail/node";
import { LogtailTransport } from "@logtail/winston";
const { combine, timestamp, errors, json } = winston.format;

const logtail = new Logtail(process.env.BS_TOKEN!, {
  endpoint: process.env.BS_ENDPOINT,
});

export const logger = winston.createLogger({
  level: "info",
  format: combine(timestamp(), errors({ stack: true }), json()),
  transports: [new LogtailTransport(logtail)],
});

// NEW: Import BullMQ queue and worker utilities
import { closeResumeQueue } from "./config/bullmq-config";
import {
  resumeWorker,
  closeResumeWorker,
} from "./workers/resume-parser-worker"; // Start the worker

const app = express();
const port = process.env.PORT || 80;
app.set("trust proxy", 1 /* number of proxies between user and server */);
app.use(
  cors({
    origin: "http://localhost:8081",
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/ok", (req, res) => {
  // If authMiddleware passes, req.user will be populated
  res.status(200).json({ message: "Pong" });
});

app.use("/api/resume", authMiddleware, resumeRouter);

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    logger.error("Unhandled error:", err.stack || err.message || err);
    res.status(err.status || 500).json({
      message: err.message || "An unexpected error occurred.",
      // Optionally include stack in development
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  },
);

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
