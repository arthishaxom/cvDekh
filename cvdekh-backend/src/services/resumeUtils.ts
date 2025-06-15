import { SupabaseClient } from "@supabase/supabase-js"; // Import SupabaseClient
import { ParsedResumeData } from "../lib/aiService";
import {
  deleteCachedData,
  getCachedData,
  setCachedData,
} from "../utils/cacheHelpers";
import { error } from "console";
import { logger } from "../server";

const CACHE_TTL = 900;

export async function upsertResume(
  supabase: SupabaseClient,
  userId: string,
  parsedData: any,
  options: {
    resumeId?: string | null; // If provided, upsert this specific resume
    isOriginal?: boolean; // If true and no resumeId, upsert the original resume
  } = {},
) {
  const { resumeId, isOriginal = true } = options;

  let targetResumeId: string;
  let wasUpdated: boolean;
  let cacheKey: string;

  if (resumeId) {
    // Case 1: Updating/creating a specific resume by ID
    const { data: existingResume, error: fetchError } = await supabase
      .from("resume")
      .select("id, user_id")
      .eq("id", resumeId)
      .eq("user_id", userId) // Ensure user owns this resume
      .maybeSingle();

    if (fetchError) {
      logger.error("Error fetching resume:", fetchError);
      throw fetchError;
    }

    if (existingResume) {
      // Update existing resume
      const { error: updateError } = await supabase
        .from("resume")
        .update({ data: parsedData })
        .eq("id", resumeId);

      if (updateError) throw updateError;
      targetResumeId = resumeId;
      wasUpdated = true;
    } else {
      // Resume ID doesn't exist or doesn't belong to user
      throw new Error("Resume not found or access denied");
    }

    cacheKey = `user:${userId}:resume:${resumeId}`;
  } else if (isOriginal) {
    // Case 2: Upsert original resume (existing logic)
    const { data: existingOriginal, error: fetchError } = await supabase
      .from("resume")
      .select("id")
      .eq("user_id", userId)
      .eq("is_original", true)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existingOriginal) {
      // Update existing original
      const { error: updateError } = await supabase
        .from("resume")
        .update({ data: parsedData })
        .eq("id", existingOriginal.id);

      if (updateError) throw updateError;
      targetResumeId = existingOriginal.id;
      wasUpdated = true;
    } else {
      // Create new original
      const { data: insertData, error: insertError } = await supabase
        .from("resume")
        .insert({
          user_id: userId,
          data: parsedData,
          is_original: true,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;
      targetResumeId = insertData.id;
      wasUpdated = false;
    }

    cacheKey = `user:${userId}:original_resume`;
  } else {
    // Case 3: Create new non-original resume
    const { data: insertData, error: insertError } = await supabase
      .from("resume")
      .insert({
        user_id: userId,
        data: parsedData,
        is_original: false,
      })
      .select("id")
      .single();

    if (insertError) throw insertError;
    targetResumeId = insertData.id;
    wasUpdated = false;
    cacheKey = `user:${userId}:resume:${targetResumeId}`;
  }

  // Invalidate relevant caches
  await deleteCachedData(cacheKey);

  // Also invalidate user's resume list cache
  await deleteCachedData(`user:${userId}:resumes`);

  return {
    id: targetResumeId,
    updated: wasUpdated,
    isOriginal: resumeId ? false : isOriginal, // Return whether this is the original resume
  };
}

export async function getOriginalResume(
  supabase: SupabaseClient,
  userId: string,
): Promise<ParsedResumeData> {
  const cacheKey = `user:${userId}:original_resume`;

  const cachedResume = await getCachedData(cacheKey);
  if (cachedResume) {
    return cachedResume as ParsedResumeData;
  }

  const { data, error } = await supabase
    .from("resume")
    .select("data")
    .eq("user_id", userId)
    .eq("is_original", true)
    .maybeSingle();

  if (error) throw error;

  if (data?.data) {
    await setCachedData(cacheKey, data.data, CACHE_TTL);
  }

  return data?.data as ParsedResumeData;
}

export async function getResumeById(
  supabase: SupabaseClient,
  resumeId: string,
  userId: string,
): Promise<ParsedResumeData> {
  const cacheKey = `resume:${resumeId}:${userId}`;

  // Try cache first
  const cachedResume = await getCachedData(cacheKey);
  if (cachedResume) {
    return cachedResume as ParsedResumeData;
  }

  const { data, error } = await supabase
    .from("resume")
    .select("data")
    .eq("id", resumeId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  if (data?.data) {
    await setCachedData(cacheKey, data.data, CACHE_TTL);
  }

  return data?.data as ParsedResumeData;
}

export async function getUserResumes(
  supabase: SupabaseClient,
  userId: string,
): Promise<
  { id: string; data: any; created_at: string; updated_at?: string }[]
> {
  const cacheKey = `user:${userId}:all_resumes`;

  // Try cache first
  const cachedResumes = await getCachedData(cacheKey);
  if (cachedResumes) {
    return cachedResumes as {
      id: string;
      data: any;
      created_at: string;
      updated_at?: string;
    }[];
  }

  const { data, error } = await supabase
    .from("resume")
    .select("id, data, job_desc, created_at, updated_at")
    .eq("user_id", userId)
    .eq("is_original", false)
    .order("created_at", { ascending: false }); // Most recent first

  if (error) throw error;

  if (data) {
    await setCachedData(cacheKey, data, 300); // 5 minutes
  }

  return data || [];
}

export async function insertImprovedResume(
  supabase: SupabaseClient,
  userId: string,
  improvedData: ParsedResumeData,
  jobDesc: any, // Changed from string to any to match frontend
): Promise<any> {
  // Consider defining a more specific return type
  const { data: insertData, error: insertError } = await supabase
    .from("resume")
    .insert({
      user_id: userId,
      data: improvedData,
      is_original: false,
      job_desc: jobDesc, // Add job_desc here
    })
    .select("*") // Select all columns to return the full new row
    .single();

  if (insertError) throw insertError;

  const cacheKey = `user:${userId}:all_resumes`;
  await deleteCachedData(cacheKey);

  return insertData;
}

export async function cleanupUserResumes(
  supabaseClient: any,
  userId: string,
  bucketName: string,
) {
  try {
    // List all files in the user's folder
    const { data: files, error: listError } = await supabaseClient.storage
      .from(bucketName)
      .list(userId);

    if (listError) {
      logger.error("Error listing files for cleanup:", listError);
      return;
    }

    if (files && files.length > 0) {
      // Create array of file paths to delete
      const filesToDelete = files.map(
        (file: { name: any }) => `${userId}/${file.name}`,
      );

      // Delete all existing files for this user
      const { error: deleteError } = await supabaseClient.storage
        .from(bucketName)
        .remove(filesToDelete);

      if (deleteError) {
        logger.error("Error deleting old files:", deleteError);
      } else {
      }
    }
  } catch (error) {
    logger.error("Error in cleanup function:", error);
    // Don't throw - cleanup failures shouldn't stop the main process
  }
}

export async function deleteResume(
  supabase: SupabaseClient,
  userId: string,
  resumeId: string,
): Promise<any> {
  const response = await supabase
    .from("resume")
    .delete()
    .eq("user_id", userId)
    .eq("id", resumeId)
    .eq("is_original", false);
}
