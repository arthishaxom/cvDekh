import { Request, Response, NextFunction } from "express";
import { supabase } from "../lib/supabaseClient"; // Adjust path if your lib folder is elsewhere

// Define an interface for requests that have been authenticated
export interface AuthenticatedRequest extends Request {
  user?: any; // You can replace 'any' with a more specific Supabase User type if available
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
      error,
    } = await supabase.auth.getUser(token);

    if (error) {
      console.error("Supabase auth.getUser error:", error.message);
      res.status(401).json({ message: `Unauthorized: ${error.message}` });
      return;
    }

    if (!user) {
      res
        .status(401)
        .json({ message: "Unauthorized: Invalid token or user not found." });
      return;
    }

    req.user = user; // Attach user object to the request
    next();
  } catch (err: any) {
    console.error("Auth middleware internal error:", err.message);
    res
      .status(500)
      .json({ message: "Internal server error during authentication." });
    return; // Return to exit the middlewar
  }
};
