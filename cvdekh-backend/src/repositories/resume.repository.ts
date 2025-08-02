import type { FileObject } from "@supabase/storage-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "..";
import type { JobDesc } from "../models/job.model";
import type { ResumeData } from "../models/resume.model";
import type { Database, Json, Tables } from "../types/database.type";

type TypedSupabaseClient = SupabaseClient<Database>;

// Helper functions
function toSupabaseJson<T>(data: T): Json {
  return JSON.parse(JSON.stringify(data)) as Json;
}

export class ResumeRepository {
  async findById(
    supabase: TypedSupabaseClient,
    resumeId: string,
    userId: string
  ): Promise<Tables<"resume"> | null> {
    const { data, error } = await supabase
      .from("resume")
      .select("*")
      .eq("id", resumeId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async findOriginalByUserId(
    supabase: TypedSupabaseClient,
    userId: string
  ): Promise<Tables<"resume"> | null> {
    const { data, error } = await supabase
      .from("resume")
      .select("*")
      .eq("user_id", userId)
      .eq("is_original", true)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async findAllByUserId(
    supabase: TypedSupabaseClient,
    userId: string
  ): Promise<Tables<"resume">[]> {
    const { data, error } = await supabase
      .from("resume")
      .select("*")
      .eq("user_id", userId)
      .eq("is_original", false)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async create(
    supabase: TypedSupabaseClient,
    resumeData: {
      userId: string;
      data: ResumeData;
      isOriginal: boolean;
      jobDesc?: JobDesc;
    }
  ): Promise<Tables<"resume">> {
    const { data, error } = await supabase
      .from("resume")
      .insert({
        user_id: resumeData.userId,
        data: toSupabaseJson(resumeData.data),
        is_original: resumeData.isOriginal,
        job_desc: resumeData.jobDesc
          ? toSupabaseJson(resumeData.jobDesc)
          : null,
      })
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  async updateById(
    supabase: TypedSupabaseClient,
    resumeId: string,
    data: ResumeData
  ): Promise<void> {
    const { error } = await supabase
      .from("resume")
      .update({ data: toSupabaseJson(data) })
      .eq("id", resumeId);

    if (error) throw error;
  }

  async deleteById(
    supabase: TypedSupabaseClient,
    resumeId: string,
    userId: string
  ): Promise<void> {
    const { error } = await supabase
      .from("resume")
      .delete()
      .eq("id", resumeId)
      .eq("user_id", userId)
      .eq("is_original", false);

    if (error) throw error;
  }

  async cleanupUserFiles(
    supabase: TypedSupabaseClient,
    userId: string,
    bucketName: string
  ): Promise<void> {
    try {
      // List all files in the user's folder
      const { data: files, error: listError } = await supabase.storage
        .from(bucketName)
        .list(userId);

      if (listError) {
        logger.error("Error listing files for cleanup:", listError);
        return;
      }

      if (files && files.length > 0) {
        // Create array of file paths to delete
        const filesToDelete = files.map(
          (file: FileObject) => `${userId}/${file.name}`
        );

        // Delete all existing files for this user
        const { error: deleteError } = await supabase.storage
          .from(bucketName)
          .remove(filesToDelete);

        if (deleteError) {
          logger.error("Error deleting old files:", deleteError);
        }
      }
    } catch (error) {
      logger.error("Error in cleanup function:", error);
      // Don't throw - cleanup failures shouldn't stop the main process
    }
  }
}

export const resumeRepository = new ResumeRepository();
