import { createClient } from "@supabase/supabase-js";
import type { NextFunction, Response } from "express";
import { logger } from "..";
import { supabase } from "../db";
import type { AuthenticatedRequest } from "../types/auth.type";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";

export const authMiddleware = asyncHandler<AuthenticatedRequest, Response>(
  async (req: AuthenticatedRequest, _: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Unauthorized: Missing or invalid token.");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new ApiError(401, "Unauthorized: Missing token.");
    }

    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser(token);

    if (getUserError) {
      logger.error("Supabase auth.getUser error:", getUserError.message);
      throw new ApiError(401, `Unauthorized: ${getUserError.message}`);
    }

    if (!user) {
      throw new ApiError(401, "Unauthorized: Invalid token or user not found.");
    }

    req.user = user;

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON;

    if (!supabaseUrl || !supabaseAnonKey) {
      logger.error(
        "Supabase URL or Anon Key is not defined in environment variables."
      );
      throw new ApiError(500, "Server Config Error");
    }

    req.supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    next();
  }
);
