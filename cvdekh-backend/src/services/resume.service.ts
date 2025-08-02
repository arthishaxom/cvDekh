import type { SupabaseClient } from "@supabase/supabase-js";
import { CACHE_KEYS, CACHE_TTL } from "../constants";
import type { JobDesc } from "../models/job.model";
import type { ResumeData } from "../models/resume.model";
import { resumeRepository } from "../repositories/resume.repository";
import type { Database, Tables } from "../types/database.type";
import { cacheService } from "./cache.service";

type TypedSupabaseClient = SupabaseClient<Database>;

export interface UpsertResumeOptions {
  resumeId?: string | null;
  isOriginal?: boolean;
}

export interface UpsertResumeResult {
  id: string;
  updated: boolean;
  isOriginal: boolean;
}

class ResumeServiceClass {
  async upsertResume(
    supabase: TypedSupabaseClient,
    userId: string,
    parsedData: ResumeData,
    options: UpsertResumeOptions = {}
  ): Promise<UpsertResumeResult> {
    const { resumeId, isOriginal = true } = options;

    // Case 1: Update specific resume by ID
    if (resumeId) {
      return this.updateExistingResume(supabase, resumeId, userId, parsedData);
    }

    // Case 2: Upsert original resume
    if (isOriginal) {
      return this.upsertOriginalResume(supabase, userId, parsedData);
    }

    // Case 3: Create new non-original resume
    return this.createNewResume(supabase, userId, parsedData, false);
  }

  private async updateExistingResume(
    supabase: TypedSupabaseClient,
    resumeId: string,
    userId: string,
    parsedData: ResumeData
  ): Promise<UpsertResumeResult> {
    const existingResume = await resumeRepository.findById(
      supabase,
      resumeId,
      userId
    );

    if (!existingResume) {
      throw new Error("Resume not found or access denied");
    }

    await resumeRepository.updateById(supabase, resumeId, parsedData);
    await this.invalidateResumeCache(userId, resumeId);

    return {
      id: resumeId,
      updated: true,
      isOriginal: false,
    };
  }

  private async upsertOriginalResume(
    supabase: TypedSupabaseClient,
    userId: string,
    parsedData: ResumeData
  ): Promise<UpsertResumeResult> {
    const existingOriginal = await resumeRepository.findOriginalByUserId(
      supabase,
      userId
    );

    if (existingOriginal) {
      await resumeRepository.updateById(
        supabase,
        existingOriginal.id,
        parsedData
      );
      await this.invalidateResumeCache(userId, existingOriginal.id);

      return {
        id: existingOriginal.id,
        updated: true,
        isOriginal: true,
      };
    } else {
      return this.createNewResume(supabase, userId, parsedData, true);
    }
  }

  private async createNewResume(
    supabase: TypedSupabaseClient,
    userId: string,
    parsedData: ResumeData,
    isOriginal: boolean
  ): Promise<UpsertResumeResult> {
    const newResume = await resumeRepository.create(supabase, {
      userId,
      data: parsedData,
      isOriginal,
    });

    await this.invalidateUserResumesCache(userId);

    return {
      id: newResume.id,
      updated: false,
      isOriginal,
    };
  }

  async getOriginalResume(
    supabase: TypedSupabaseClient,
    userId: string
  ): Promise<ResumeData | null> {
    const cacheKey = CACHE_KEYS.USER_ORIGINAL_RESUME(userId);

    const cached = await cacheService.get<ResumeData>(cacheKey);
    if (cached) return cached;

    const resume = await resumeRepository.findOriginalByUserId(
      supabase,
      userId
    );
    if (!resume?.data) return null;

    const parsedData = resume.data as unknown as ResumeData;
    await cacheService.set(cacheKey, parsedData, CACHE_TTL.RESUME);

    return parsedData;
  }

  async getResumeById(
    supabase: TypedSupabaseClient,
    resumeId: string,
    userId: string
  ): Promise<ResumeData | null> {
    const cacheKey = CACHE_KEYS.RESUME_BY_ID(resumeId, userId);

    const cached = await cacheService.get<ResumeData>(cacheKey);
    if (cached) return cached;

    const resume = await resumeRepository.findById(supabase, resumeId, userId);
    if (!resume?.data) return null;

    const parsedData = resume.data as unknown as ResumeData;
    await cacheService.set(cacheKey, parsedData, CACHE_TTL.RESUME);

    return parsedData;
  }

  async getUserResumes(
    supabase: TypedSupabaseClient,
    userId: string
  ): Promise<Tables<"resume">[]> {
    const cacheKey = CACHE_KEYS.USER_ALL_RESUMES(userId);

    const cached = await cacheService.get<Tables<"resume">[]>(cacheKey);
    if (cached) return cached;

    const resumes = await resumeRepository.findAllByUserId(supabase, userId);
    await cacheService.set(cacheKey, resumes, CACHE_TTL.RESUME_LIST);

    return resumes;
  }

  async createImprovedResume(
    supabase: TypedSupabaseClient,
    userId: string,
    improvedData: ResumeData,
    jobDesc: JobDesc
  ): Promise<Tables<"resume">> {
    const newResume = await resumeRepository.create(supabase, {
      userId,
      data: improvedData,
      isOriginal: false,
      jobDesc,
    });

    await this.invalidateUserResumesCache(userId);
    return newResume;
  }

  async deleteResume(
    supabase: TypedSupabaseClient,
    userId: string,
    resumeId: string
  ): Promise<void> {
    await resumeRepository.deleteById(supabase, resumeId, userId);
    await this.invalidateResumeCache(userId, resumeId);
  }

  async cleanupUserFiles(
    supabase: TypedSupabaseClient,
    userId: string,
    bucketName: string
  ): Promise<void> {
    await resumeRepository.cleanupUserFiles(supabase, userId, bucketName);
  }

  // Helper methods for cache invalidation
  private async invalidateResumeCache(
    userId: string,
    resumeId?: string
  ): Promise<void> {
    const keysToDelete = [
      CACHE_KEYS.USER_ORIGINAL_RESUME(userId),
      CACHE_KEYS.USER_ALL_RESUMES(userId),
    ];

    if (resumeId) {
      keysToDelete.push(
        CACHE_KEYS.USER_RESUME(userId, resumeId),
        CACHE_KEYS.RESUME_BY_ID(resumeId, userId)
      );
    }

    await Promise.all(keysToDelete.map((key) => cacheService.delete(key)));
  }

  private async invalidateUserResumesCache(userId: string): Promise<void> {
    await cacheService.delete(CACHE_KEYS.USER_ALL_RESUMES(userId));
  }
}

export const resumeService = new ResumeServiceClass();
