// hooks/useResumeParser.ts

import type { Session } from "@supabase/supabase-js";
import { useState } from "react";
import Toast from "react-native-toast-message";
import { useResumeStore } from "@/store/resume/resumeStore";
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

      if (response?.jobId) {
        const result = await pollJobStatus(session, response.jobId);

        if (result.success && result.data) {
          setData(result.data);
          setOriginalData(result.data);

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

  const pollJobStatus = async (session: Session, jobId: string) => {
    return new Promise<{ success: boolean; data?: any }>((resolve) => {
      const poll = async () => {
        try {
          const response = await resumeApi.getJobStatus(session, jobId);
          const { status, data, progress: jobProgress, error } = response;

          setProgress(jobProgress || progress);

          if (status === "completed") {
            setProgress(100);
            resolve({ success: true, data });
          } else if (status === "failed") {
            Toast.show({
              type: "eToast",
              text1: "Parse Failed",
              text2: error || "Parsing job failed.",
            });
            resolve({ success: false });
          } else if (["active", "waiting", "delayed"].includes(status)) {
            setTimeout(poll, 2000);
          } else {
            resolve({ success: false });
          }
        } catch (error) {
          resolve({ success: false });
        }
      };

      poll();
    });
  };

  return {
    isLoading,
    progress,
    parseResume,
  };
};
