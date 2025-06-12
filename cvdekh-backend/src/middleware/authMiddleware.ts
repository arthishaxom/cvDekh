import { Request, Response, NextFunction } from "express";
import { supabase as globalSupabase } from "../config/supabaseClient"; // Rename to avoid confusion
import { User, SupabaseClient, createClient } from "@supabase/supabase-js"; // Import SupabaseClient and createClient
import { logger } from "../server";

// Define an interface for requests that have been authenticated
export interface AuthenticatedRequest extends Request {
  user?: User;
  supabaseClient?: SupabaseClient; // Add this line
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      message: "Unauthorized: No token provided or token is malformed.",
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Unauthorized: No token extracted." });
    return;
  }

  try {
    const {
      data: { user },
      error: getUserError,
    } = await globalSupabase.auth.getUser(token);

    if (getUserError) {
      logger.error("Supabase auth.getUser error:", getUserError.message);
      res
        .status(401)
        .json({ message: `Unauthorized: ${getUserError.message}` });
      return;
    }

    if (!user) {
      res
        .status(401)
        .json({ message: "Unauthorized: Invalid token or user not found." });
      return;
    }

    req.user = user; // Attach user object to the request

    // Create a new Supabase client instance scoped to this user's request
    // Ensure SUPABASE_URL and SUPABASE_ANON_KEY are available in your environment
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON;

    if (!supabaseUrl || !supabaseAnonKey) {
      logger.error(
        "Supabase URL or Anon Key is not defined in environment variables.",
      );
      res.status(500).json({ message: "Server configuration error." });
      return;
    }

    req.supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    next();
  } catch (err: any) {
    logger.error("Auth middleware internal error:", err.message);
    res
      .status(500)
      .json({ message: "Internal server error during authentication." });
    return; // Return to exit the middlewar
  }
};
