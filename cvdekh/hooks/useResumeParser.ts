// hooks/useResumeParser.ts

import type { Session } from "@supabase/supabase-js";
import { useState } from "react";
import Toast from "react-native-toast-message";
import { useResumeStore } from "@/store/resume/resumeStore";
import type { ResumeFormData } from "@/store/resume/types";
import { resumeApi } from "@/utils/api.util";

export const useResumeParser = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const { setData, setOriginalData } = useResumeStore();

  const parseResume = async (
    session: Session,
    selectedFile: any,
    onComplete?: () => void
  ) => {
    if (!selectedFile) {
      Toast.show({
        type: "iToast",
        text1: "No File Selected",
        text2: "Please select a PDF file to extract.",
      });
      return { success: false };
    }

    setIsLoading(true);
    setProgress(5);

    try {
      const formData = new FormData();
      formData.append("resume", {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType || "application/pdf",
      } as any);

      const response = await resumeApi.parseResume(session, formData);

      if (response?.data?.jobId) {
        const result = await pollJobStatus(session, response.data.jobId);

        if (result.success && result.resume) {
          setData(result.resume);
          setOriginalData(result.resume);

          Toast.show({
            type: "sToast",
            text1: "Success",
            text2: "Resume parsed successfully.",
          });

          setTimeout(() => {
            onComplete?.();
            setProgress(0);
          }, 1500);
        }

        return result;
      }
    } catch (error) {
      Toast.show({
        type: "eToast",
        text1: "Parse Failed",
        text2: "Failed to parse resume.",
      });
    } finally {
      setIsLoading(false);
    }

    return { success: false };
  };

  const pollJobStatus = async (
    session: Session,
    jobId: string,
    maxWaitTimeMs = 120000 // 2 minutes timeout
  ): Promise<{ success: boolean; resume?: ResumeFormData }> => {
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds between polls

    while (true) {
      // Check if we've exceeded our maximum wait time
      if (Date.now() - startTime > maxWaitTimeMs) {
        Toast.show({
          type: "eToast",
          text1: "Parse Timeout",
          text2: "Parsing is taking too long. Please try again.",
        });
        throw new Error("Polling timeout - job took too long to complete");
      }

      try {
        const response = await resumeApi.getJobStatus(session, jobId);
        const { status, resume, progress: jobProgress, error } = response.data;

        // ✅ Progress smoothing (explained below)
        if (typeof jobProgress === "number") {
          const smoothed = smoothProgress(jobProgress, progress);
          setProgress(smoothed);
        }

        // Handle completion states
        if (status === "completed") {
          setProgress(100);
          return { success: true, resume }; // ✅ SUCCESS EXIT
        }

        if (status === "failed") {
          Toast.show({
            type: "eToast",
            text1: "Parse Failed",
            text2: error || "Parsing job failed.",
          });
          return { success: false }; // ✅ FAILURE EXIT
        }

        // If still processing, wait before next poll
        if (["active", "waiting", "delayed"].includes(status)) {
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
          continue; // ✅ CONTINUE POLLING
        }

        // Unknown status - treat as failure
        console.warn(`Unknown job status: ${status}`);
        return { success: false }; // ✅ UNKNOWN STATUS EXIT
      } catch (error) {
        console.error("Polling error:", error);

        // For network errors, we could retry, but for simplicity, return failure
        Toast.show({
          type: "eToast",
          text1: "Parse Failed",
          text2: "Network error while checking status.",
        });
        return { success: false }; // ✅ ERROR EXIT
      }
    }
  };

  const smoothProgress = (newProgress: number, currentProgress: number) => {
    // 1. Never go backwards
    const noBacktrack = Math.max(newProgress, currentProgress);

    // 2. Don't jump more than 10% at once (prevents sudden jumps)
    const maxJump = currentProgress + 10;
    const gradualIncrease = Math.min(noBacktrack, maxJump);

    // 3. Always make some progress (even if server doesn't update)
    const minimumProgress = currentProgress + 0.5;

    // 4. Cap at 95% until actually complete
    const cappedProgress = Math.min(
      Math.max(gradualIncrease, minimumProgress),
      95
    );

    return cappedProgress;
  };

  return {
    isLoading,
    progress,
    parseResume,
  };
};
