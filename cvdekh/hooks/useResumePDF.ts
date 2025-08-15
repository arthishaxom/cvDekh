import type { Session } from "@supabase/supabase-js";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import Toast from "react-native-toast-message";
import { useResumeStore } from "@/store/resume/resumeStore";
import { resumeApi } from "@/utils/api.util";

export const useResumePDF = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const formData = useResumeStore((state) => state.formData);

  const generatePDF = async (
    session: Session,
    resumeId?: string,
    onComplete?: (pdfUri?: string) => void
  ) => {
    if (!formData || Object.keys(formData).length === 0) {
      Toast.show({
        type: "iToast",
        text1: "No Resume Data",
        text2: "Please complete your resume first.",
      });
      return { success: false };
    }

    setIsLoading(true);
    setProgress(5);

    try {
      // Start PDF generation job
      const response = resumeId
        ? await resumeApi.generatePDF(session, resumeId)
        : await resumeApi.generatePDF(session);

      if (response.data.jobId) {
        const result = await pollPDFStatus(session, response.data.jobId);

        if (result.success && result.pdfUrl) {
          Toast.show({
            type: "sToast",
            text1: "Success",
            text2: "Resume PDF generated successfully.",
          });
          setTimeout(() => {
            onComplete?.(result.pdfUrl);
            setProgress(0);
          }, 500);
          await openPDF(result.pdfUrl);
          return { success: true, pdfUri: result.pdfUrl };
        }

        return result;
      }
    } catch (error) {
      console.error("PDF generation error:", error);
      Toast.show({
        type: "eToast",
        text1: "Generation Failed",
        text2: "Failed to generate PDF.",
      });
    } finally {
      setIsLoading(false);
    }

    return { success: false };
  };

  const pollPDFStatus = async (
    session: Session,
    jobId: string,
    maxWaitTimeMs = 180000 // 3 minutes timeout (PDF generation can take longer)
  ): Promise<{ success: boolean; pdfUrl?: string }> => {
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds between polls

    while (true) {
      // Check if we've exceeded our maximum wait time
      if (Date.now() - startTime > maxWaitTimeMs) {
        Toast.show({
          type: "eToast",
          text1: "Generation Timeout",
          text2: "PDF generation is taking too long. Please try again.",
        });
        return { success: false };
      }

      try {
        const response = await resumeApi.getPDFJobStatus(session, jobId);
        const { status, progress: jobProgress, data: pdfData } = response.data;
        const error = response.error;
        const pdfUrl = pdfData?.pdfUrl;

        // ✅ Progress smoothing
        if (typeof jobProgress === "number") {
          const smoothed = smoothProgress(jobProgress, progress);
          setProgress(smoothed);
        }

        // Handle completion states
        if (status === "completed") {
          setProgress(95); // Leave 5% for download
          return { success: true, pdfUrl }; // ✅ SUCCESS EXIT
        }

        if (status === "failed") {
          Toast.show({
            type: "eToast",
            text1: "Generation Failed",
            text2: error || "PDF generation job failed.",
          });
          return { success: false }; // ✅ FAILURE EXIT
        }

        // If still processing, wait before next poll
        if (["active", "waiting", "delayed", "queued"].includes(status)) {
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
          continue; // ✅ CONTINUE POLLING
        }

        // Unknown status - treat as failure
        console.warn(`Unknown PDF job status: ${status}`);
        return { success: false }; // ✅ UNKNOWN STATUS EXIT
      } catch (error) {
        console.error("PDF polling error:", error);

        Toast.show({
          type: "eToast",
          text1: "Generation Failed",
          text2: "Network error while checking PDF status.",
        });
        return { success: false }; // ✅ ERROR EXIT
      }
    }
  };

  const openPDF = async (pdfUrl: string) => {
    try {
      await WebBrowser.openBrowserAsync(`${pdfUrl}?download`);
      return { success: true };
    } catch (error) {
      console.error("PDF opening error:", error);
      Toast.show({
        type: "eToast",
        text1: "Open Failed",
        text2: "Failed to open PDF.",
      });
      return { success: false };
    }
  };

  const smoothProgress = (newProgress: number, currentProgress: number) => {
    // 1. Never go backwards
    const noBacktrack = Math.max(newProgress, currentProgress);

    // 2. Don't jump more than 15% at once (PDF generation can have bigger jumps)
    const maxJump = currentProgress + 15;
    const gradualIncrease = Math.min(noBacktrack, maxJump);

    // 3. Always make some progress (even if server doesn't update)
    const minimumProgress = currentProgress + 0.3;

    // 4. Cap at 95% until download starts
    const cappedProgress = Math.min(
      Math.max(gradualIncrease, minimumProgress),
      95
    );

    return cappedProgress;
  };

  return {
    isLoading,
    progress,
    generatePDF,
    openPDF,
  };
};
