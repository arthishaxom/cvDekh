import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/apiError";

export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const error = new ApiError(404, `Route ${req.originalUrl} not found`);
  next(error);
};
