import { SupabaseClient } from "@supabase/supabase-js"; // Import SupabaseClient
import { ParsedResumeData } from "../lib/aiService";

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

  if (existingOriginal) {
    const { error: updateError } = await supabase
      .from("resume")
      .update({ data: parsedData })
      .eq("id", existingOriginal.id);
    if (updateError) throw updateError;
    return { updated: true, id: existingOriginal.id };
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
    return { updated: false, id: insertData.id };
  }
}

export async function getOriginalResume(
  supabase: SupabaseClient, // Change type from 'any' to 'SupabaseClient'
  userId: string,
): Promise<ParsedResumeData> {
  const { data, error } = await supabase
    .from("resume")
    .select("data")
    .eq("user_id", userId)
    .eq("is_original", true)
    .maybeSingle();

  if (error) throw error;

  return data?.data as ParsedResumeData;
}

export async function getResumeById(
  supabase: SupabaseClient,
  resumeId: string,
  userId: string,
): Promise<ParsedResumeData> {
  const { data, error } = await supabase
    .from("resume")
    .select("data")
    .eq("id", resumeId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data?.data as ParsedResumeData;
}

export async function getUserResumes(
  supabase: SupabaseClient,
  userId: string,
): Promise<
  { id: string; data: any; created_at: string; updated_at?: string }[]
> {
  const { data, error } = await supabase
    .from("resume")
    .select("id, data, created_at, updated_at")
    .eq("user_id", userId)
    .eq("is_original", false)
    .order("created_at", { ascending: false }); // Most recent first

  if (error) throw error;
  return data || [];
}
