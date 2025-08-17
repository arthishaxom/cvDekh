import type {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from "express";
import logger from "../config/logger.config";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";

export const globalErrorHandler: ErrorRequestHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Log the error with context
  logger.error("Unhandled error:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  // Check if it's our custom ApiError
  if (err instanceof ApiError) {
    res
      .status(err.statusCode)
      .json(new ApiResponse(err.statusCode, null, err.message));
    return;
  }

  // Handle specific error types
  if (err.name === "ValidationError") {
    res.status(400).json(new ApiResponse(400, null, "Validation failed"));
    return;
  }

  if (err.name === "CastError") {
    res.status(400).json(new ApiResponse(400, null, "Invalid ID format"));
    return;
  }

  // Handle Supabase errors
  if (err.message?.includes("JWT")) {
    res
      .status(401)
      .json(new ApiResponse(401, null, "Invalid authentication token"));
    return;
  }

  // Handle rate limit errors
  if (err.message?.includes("Too Many Requests")) {
    res
      .status(429)
      .json(
        new ApiResponse(429, null, "Too many requests, please try again later")
      );
    return;
  }

  // Handle file upload errors
  if (err.message?.includes("File too large")) {
    res.status(413).json(new ApiResponse(413, null, "File size too large"));
    return;
  }

  if (err.message?.includes("Only PDF files are allowed")) {
    res
      .status(400)
      .json(new ApiResponse(400, null, "Only PDF files are allowed"));
    return;
  }

  // Default to 500 server error for unknown errors
  const statusCode = 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "An unexpected error occurred";

  const responseData =
    process.env.NODE_ENV === "development" ? { stack: err.stack } : null;

  res
    .status(statusCode)
    .json(new ApiResponse(statusCode, responseData, message));
};
