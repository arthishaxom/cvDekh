import express from "express";
import resumeRouter from "./routes/resume";
import "dotenv/config";
import {
  authMiddleware,
  AuthenticatedRequest,
} from "./middleware/authMiddleware";
import { closeRedis, initializeRedis } from "./config/redisClient"; // This is for your general app Redis, if different
import cors from "cors";

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

app.get("/api/ok", authMiddleware, (req: AuthenticatedRequest, res) => {
  // If authMiddleware passes, req.user will be populated
  res
    .status(200)
    .json({ message: "Pong", userId: req.user?.id, email: req.user?.email });
});

app.use("/api/resume", authMiddleware, resumeRouter);

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("Unhandled error:", err.stack || err.message || err);
    res.status(err.status || 500).json({
      message: err.message || "An unexpected error occurred.",
      // Optionally include stack in development
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  },
);

const startServer = async () => {
  try {
    console.log("🚀 Starting cvDekh Server...");

    // Initialize general Redis connection (if used by other parts of your app)
    console.log("📡 Connecting to general Redis...");
    await initializeRedis();

    // BullMQ worker is started when resume-parser-worker.ts is imported.
    // You can add a log here to confirm:
    console.log("⚙️ BullMQ Resume Worker initialized.");
    console.log("⚙️ BullMQ Resume Queue initialized (from bullmq-config.ts).");

    // Start the Express server
    const server = app.listen(port, () => {
      console.log(`✅ cvDekh Server listening on port ${port}`);
      console.log(`🌐 Health check: http://localhost:${port}/api/ok`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received, shutting down gracefully...`);

      // NEW: Close BullMQ worker and queue
      console.log("⚙️ Closing BullMQ Worker...");
      await closeResumeWorker();
      console.log("⚙️ Closing BullMQ Queue...");
      await closeResumeQueue();

      // Close general Redis connection (if used)
      console.log("📡 Closing general Redis connection...");
      await closeRedis();

      // Close Express server
      server.close(() => {
        console.log("✅ Server closed successfully");
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error("❌ Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    // Listen for termination signals
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();
