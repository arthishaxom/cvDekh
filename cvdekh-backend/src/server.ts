import express from "express";
import resumeRouter from "./routes/resume";
import "dotenv/config";
import {
  authMiddleware,
  AuthenticatedRequest,
} from "./middleware/authMiddleware";
import { closeRedis, initializeRedis } from "./lib/redisClient";

const app = express();
const port = process.env.PORT || 80;

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

    // Initialize Redis connection
    console.log("📡 Connecting to Redis...");
    await initializeRedis();

    // Start the Express server
    const server = app.listen(port, () => {
      console.log(`✅ cvDekh Server listening on port ${port}`);
      console.log(`🌐 Health check: http://localhost:${port}/api/ok`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received, shutting down gracefully...`);

      // Close Redis connection
      console.log("📡 Closing Redis connection...");
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
