import type { Response } from "express";
import type { SkillQuery } from "../models/skill.model";
import type { AuthenticatedRequest } from "../types/auth.type";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const getSkills = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.supabaseClient || !req.user) {
      throw new ApiError(500, "Server configuration error");
    }

    const supabase = req.supabaseClient;
    const { search, category, limit = "10" } = req.query as SkillQuery;

    let queryBuilder = supabase
      .from("skills")
      .select("id, name, category")
      .limit(Math.min(parseInt(limit), 20));

    if (search && search.trim() !== "") {
      queryBuilder = queryBuilder.ilike("name", `%${search.trim()}%`);
    }

    if (category && category.trim() !== "") {
      queryBuilder = queryBuilder.eq("category", category.trim());
    }

    queryBuilder = queryBuilder.order("name", { ascending: true });

    const { data, error } = await queryBuilder;

    if (error) {
      throw new ApiError(500, "Search failed");
    }

    res.status(200).json(new ApiResponse(200, { suggestions: data || [] }));
  }
);

export { getSkills };
