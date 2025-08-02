import type { Request, Response } from "express";
import { ApiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const healthcheck = asyncHandler(async (_req: Request, res: Response) => {
  res
    .status(200)
    .json(new ApiResponse(200, "OK", "cvDekh Health check passed"));
});

export { healthcheck };
