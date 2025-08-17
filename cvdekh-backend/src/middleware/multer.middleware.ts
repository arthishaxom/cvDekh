import fs from "node:fs/promises";
import path from "node:path";
import multer from "multer";
import logger from "../config/logger.config";
import { ApiError } from "../utils/apiError";

const tempUploadsDir = path.join(process.cwd(), "temp-uploads");

// Ensure directory exists once during module initialization
const ensureTempDir = async () => {
  try {
    await fs.mkdir(tempUploadsDir, { recursive: true });
    logger.info(`Temporary upload directory ensured at: ${tempUploadsDir}`);
  } catch (error) {
    logger.error("Failed to create temp-uploads directory:", error);
    throw error;
  }
};

// Initialize directory
ensureTempDir();

export const resumeUpload = multer({
  dest: tempUploadsDir,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new ApiError(400, "Only PDF files are allowed"));
    }
  },
});
