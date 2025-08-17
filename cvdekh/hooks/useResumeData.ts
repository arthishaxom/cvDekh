// hooks/useResumeData.ts

import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { initialFormData, useResumeStore } from "@/store/resume/resumeStore";
import { ResumeFormData } from "@/store/resume/types";
import { resumeApi } from "@/utils/api.util";

export const useResumeData = (session: Session | null) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    setData,
    setOriginalData,
    setAllResumes,
    isInitialDataFetched,
    originalData,
  } = useResumeStore();

  const fetchOriginalResume = useCallback(async () => {
    if (!session || isInitialDataFetched) return;

    setIsLoading(true);
    setError(null);

    if (originalData) {
      setData(originalData);
      useResumeStore.setState({ isInitialDataFetched: true });
      setIsLoading(false);
      return;
    }

    try {
      const response = await resumeApi.getOriginalResume(session);

      if (response.data) {
        setData(response.data);
        setOriginalData(response);
        useResumeStore.setState({ isInitialDataFetched: true });
      }
    } catch (err: any) {
      if (
        err.response?.status === 404 ||
        err.message?.includes("No resume data found")
      ) {
        setData(initialFormData);
        setOriginalData(initialFormData);
        useResumeStore.setState({ isInitialDataFetched: true });
      } else {
        setError(
          `Failed to load resume data: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [isInitialDataFetched, originalData, session, setData, setOriginalData]);

  const fetchAllResumes = useCallback(async () => {
    if (!session) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await resumeApi.getAllResumes(session);

      setAllResumes(response.data.resumes);
    } catch (_err) {
      setError("Failed to fetch resumes");
    } finally {
      setIsLoading(false);
    }
  }, [session, setAllResumes]);

  const refetch = useCallback(() => {
    if (session) {
      useResumeStore.setState({ isInitialDataFetched: false });
      fetchOriginalResume();
      fetchAllResumes();
    }
  }, [session, fetchOriginalResume, fetchAllResumes]);

  useEffect(() => {
    if (session && !isInitialDataFetched) {
      fetchOriginalResume();
    }
  }, [session, fetchOriginalResume, isInitialDataFetched]);

  return {
    isLoading,
    error,
    fetchOriginalResume,
    fetchAllResumes,
    refetch,
  };
};
