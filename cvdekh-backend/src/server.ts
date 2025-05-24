import express from "express";
import resumeRouter from "./routes/resume";
import dotenv from "dotenv/config";
import {
  authMiddleware,
  AuthenticatedRequest,
} from "./middleware/authMiddleware";

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

app.listen(port, () => {
  console.log(`Better Auth app listening on port ${port}`);
});
