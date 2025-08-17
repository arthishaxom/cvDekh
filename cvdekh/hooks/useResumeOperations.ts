// hooks/useResumeOperations.ts

import type { Session } from "@supabase/supabase-js";
import { useState } from "react";
import Toast from "react-native-toast-message";
import { useResumeStore } from "@/store/resume/resumeStore";
import type { ResumeFormData } from "@/store/resume/types";
import { resumeApi } from "@/utils/api.util";

export const useResumeOperations = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const { addToAllResumes, removeFromAllResumes } = useResumeStore();

  const saveResume = async (
    session: Session,
    resumeId: string | null,
    formData: ResumeFormData
  ) => {
    setIsLoading(true);
    try {
      await resumeApi.saveResume(session, {
        resumeData: formData,
        resumeId,
        isOriginal: resumeId === null,
      });

      useResumeStore.setState({ hasChanges: false });

      Toast.show({
        type: "sToast",
        text1: "Success",
        text2: "Resume has been saved successfully.",
      });
    } catch (_error) {
      Toast.show({
        type: "eToast",
        text1: "Save Failed",
        text2: "Failed to save resume. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const improveResume = async (
    session: Session,
    jobDescription: string,
    onComplete?: () => void
  ) => {
    setIsLoading(true);
    setProgress(5);

    try {
      const response = await resumeApi.improveResume(session, jobDescription);

      if (response?.success && response?.data) {
        addToAllResumes(response.data);

        setProgress(100);

        Toast.show({
          type: "sToast",
          text1: "Success",
          text2: "Resume improved successfully.",
        });

        setTimeout(() => {
          onComplete?.();
          setProgress(0);
        }, 500);
      }
    } catch (error) {
      Toast.show({
        type: "eToast",
        text1: "Improvement Failed",
        text2: `Failed to improve resume. Please try again. ${error}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteResume = async (session: Session, resumeId: string) => {
    setIsLoading(true);
    try {
      await resumeApi.deleteResume(session, resumeId);
      removeFromAllResumes(resumeId);

      Toast.show({
        type: "sToast",
        text1: "Success",
        text2: "Resume deleted successfully.",
      });

      return { success: true };
    } catch (_error) {
      Toast.show({
        type: "eToast",
        text1: "Delete Failed",
        text2: "Failed to delete resume.",
      });
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    progress,
    saveResume,
    improveResume,
    deleteResume,
  };
};
