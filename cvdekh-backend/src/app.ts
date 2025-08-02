import cors from "cors";
import express from "express";
import { globalErrorHandler } from "./middleware/errorHandler.middleware";
import { notFoundHandler } from "./middleware/notFound.middleware";
import healthcheckRouter from "./routes/healthcheck.routes";
import resumeRouter from "./routes/resume.routes";
import skillsRouter from "./routes/skills.routes";

const app = express();

app.set("trust proxy", 1);
app.use(
  cors({
    origin: "http://localhost:8081",
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/healthcheck", healthcheckRouter);

app.use("/api/v1/resumes", resumeRouter);
app.use("/api/v1/skills", skillsRouter);

app.use(notFoundHandler);

// Global error handler
app.use(globalErrorHandler);

export default app;
