import { SupabaseClient } from "@supabase/supabase-js"; // Import SupabaseClient
import { ParsedResumeData } from "../lib/aiService";
import { deleteCachedData, getCachedData, setCachedData } from "./cacheHelpers";

const CACHE_TTL = 900;

export async function upsertOriginalResume(
  supabase: SupabaseClient, // Change type from 'any' to 'SupabaseClient'
  userId: string,
  parsedData: any,
) {
  const { data: existingOriginal, error: fetchError } = await supabase
    .from("resume")
    .select("id")
    .eq("user_id", userId)
    .eq("is_original", true)
    .maybeSingle();

  if (fetchError) throw fetchError;

  let resumeId: string;
  let wasUpdated: boolean;

  if (existingOriginal) {
    const { error: updateError } = await supabase
      .from("resume")
      .update({ data: parsedData })
      .eq("id", existingOriginal.id);
    if (updateError) throw updateError;
    resumeId = existingOriginal.id;
    wasUpdated = true;
  } else {
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
    resumeId = insertData.id;
    wasUpdated = false;
  }
  // IMPORTANT: Invalidate cache after database update
  const cacheKey = `user:${userId}:original_resume`;
  await deleteCachedData(cacheKey); // Added cache invalidation
  console.log("✅ Cache invalidated for original resume");

  return { id: resumeId, updated: wasUpdated };
}

export async function getOriginalResume(
  supabase: SupabaseClient, // Change type from 'any' to 'SupabaseClient'
  userId: string,
): Promise<ParsedResumeData> {
  const cacheKey = `user:${userId}:original_resume`;

  const cachedResume = await getCachedData(cacheKey);
  if (cachedResume) {
    // console.log("✅ Returning original resume from cache");
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
    // console.log("✅ Original resume cached for future requests");
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
    // console.log('✅ Returning resume from cache');
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
    // console.log('✅ Resume cached for future requests');
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
    console.log("✅ Returning all resumes from cache");
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
    console.log("✅ All resumes cached for future requests");
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
  console.log("✅ Cache invalidated for user resume list");

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
      console.error("Error listing files for cleanup:", listError);
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
        console.error("Error deleting old files:", deleteError);
      } else {
        console.log(
          `Cleaned up ${filesToDelete.length} old resume files for user ${userId}`,
        );
      }
    }
  } catch (error) {
    console.error("Error in cleanup function:", error);
    // Don't throw - cleanup failures shouldn't stop the main process
  }
}
