import { create } from "zustand";
import { immer } from "zustand/middleware/immer"; // For easier immutable updates
import axios, { isAxiosError } from "axios"; // Or your preferred HTTP client
import { Session } from "@supabase/supabase-js";
import * as Crypto from "expo-crypto";
import { JobDetails, ResumeFormData, ResumeStoreState } from "./types";
import { downloadPDFToDevice, ensureListItemsHaveIds } from "./utils";
import Toast from "react-native-toast-message";

const initialFormData: ResumeFormData = {
  id: "",
  name: "",
  summary: "",
  contactInfo: {},
  skills: { languages: [], frameworks: [], others: [] },
  education: [],
  projects: [],
  experience: [],
};

// Helper function to download PDF to device storage
// const downloadPDFToDevice = async (
//   pdfUrl: string,
//   fileName: string = "resume.pdf",
// ) => {
//   try {
//     const { status } = await MediaLibrary.requestPermissionsAsync();
//     if (status !== "granted") {
//       Alert.alert(
//         "Permission needed",
//         "Storage permission is required to save the PDF.",
//       );
//       return;
//     }

//     const fileUri = FileSystem.documentDirectory + fileName;
//     const downloadResult = await FileSystem.downloadAsync(pdfUrl, fileUri);

//     if (downloadResult.status === 200) {

//       if (await Sharing.isAvailableAsync()) {
//         await Sharing.shareAsync(downloadResult.uri, {
//           mimeType: "application/pdf",
//           dialogTitle: "Save PDF",
//         });
//         Alert.alert("Success", "PDF ready to save!");
//       } else {
//         Alert.alert("File Downloaded", `PDF saved to: ${downloadResult.uri}`);
//       }
//     } else {
//       console.error(
//         "Download failed, status:",
//         downloadResult.status,
//         "URI:",
//         downloadResult.uri,
//       );
//       Alert.alert(
//         "Download Failed",
//         `Failed to download PDF. Server responded with status: ${downloadResult.status}`,
//       );
//     }
//   } catch (error: any) {
//     console.error("Error during PDF download or saving process:", error);
//     Alert.alert(
//       "Error",
//       `An error occurred while saving the PDF: ${error.message}`,
//     );
//   }
// };

export const useResumeStore = create<ResumeStoreState>()(
  immer((set, get) => ({
    formData: initialFormData,
    originalData: null,
    allResumes: [], // Initialize with an empty array
    isLoading: false,
    isSaving: false,
    hasChanges: false,
    isInitialDataFetched: false,
    error: null,
    progress: 0,

    setData: (data) => {
      set((state) => {
        const processedData = {
          ...initialFormData,
          ...data,
          // Ensure all list items have IDs
          education: ensureListItemsHaveIds(data.education),
          projects: ensureListItemsHaveIds(data.projects),
          experience: ensureListItemsHaveIds(data.experience),
        };

        state.formData = processedData;
        state.isLoading = false;
        state.error = null;
        state.hasChanges = false;
      });
    },

    fetchAllResume: async (session: Session) => {
      set({ isLoading: true, error: null });
      try {
        const backendApiUrl =
          process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";
        const response = await axios.get(
          `${backendApiUrl}/api/resume/get-resumes`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              // Add this header to bypass ngrok browser warning
              "ngrok-skip-browser-warning": "true",
              // Also add user-agent to make it look like a proper API request
              "User-Agent": "MyApp/1.0",
            },
          },
        );

        if (response.data) {
          const formattedResumes = response.data.resumes.map(
            (resumeEntry: {
              created_at: string;
              data: ResumeFormData;
              id: string;
              job_desc: JobDetails;
              updated_at: string;
            }) => ({
              ...initialFormData, // Start with default structure
              ...resumeEntry.data, // Spread the actual resume content
              id: resumeEntry.id, // Explicitly set the top-level ID
              // Ensure nested list items have IDs
              education: ensureListItemsHaveIds(resumeEntry.data.education),
              projects: ensureListItemsHaveIds(resumeEntry.data.projects),
              experience: ensureListItemsHaveIds(resumeEntry.data.experience),
              job_desc: resumeEntry.job_desc,
            }),
          );
          set({ allResumes: formattedResumes, isLoading: false });
        }
      } catch (error) {
        console.error("Failed to fetch resumes:", error);
        set({ isLoading: false, error: "Failed to fetch resumes." }); // Added error state update
      }
    },

    updateFormData: (section, data) => {
      set((state) => {
        const sectionData = state.formData[section];
        if (
          sectionData &&
          typeof sectionData === "object" &&
          !Array.isArray(sectionData)
        ) {
          // For object sections like contactInfo, skills
          Object.assign(sectionData, data); // Deep merge for immutability
        } else {
          // For top-level fields like name, summary or if it's an array (handled by list item actions)
          state.formData[section] = data as any;
        }
        state.hasChanges = true;
      });
    },

    addListItem: (section, item) => {
      set((state) => {
        const list = state.formData[section] as any[] | undefined;
        if (list) {
          list.push({ ...item, id: item.id || Crypto.randomUUID() });
        } else {
          state.formData[section] = [
            { ...item, id: item.id || Crypto.randomUUID() },
          ];
        }
        state.hasChanges = true;
      });
    },

    updateListItem: (section, itemId, updatedItem) => {
      set((state) => {
        const list = state.formData[section] as any[] | undefined;
        if (list) {
          const itemIndex = list.findIndex((item) => item.id === itemId);
          if (itemIndex !== -1) {
            // Direct mutation is safe with Immer
            Object.assign(list[itemIndex], updatedItem);
            state.hasChanges = true;
          }
        }
      });
    },

    removeListItem: (section, itemId) => {
      set((state) => {
        const list = state.formData[section] as any[] | undefined;
        if (list) {
          const itemIndex = list.findIndex((item) => item.id === itemId);
          if (itemIndex !== -1) {
            // Direct mutation is safe with Immer
            list.splice(itemIndex, 1);
            state.hasChanges = true;
          }
        }
      });
    },

    fetchResumeData: async (session: Session) => {
      // Critical: Check if already fetched or currently loading
      const { isInitialDataFetched, originalData } = get();

      if (isInitialDataFetched) {
        return;
      }

      set({ isLoading: true, error: null });

      if (originalData) {
        // If originalData is available, use it as the initial state
        get().setData(originalData);
        set({ isInitialDataFetched: true, isLoading: false });
        return;
      }

      try {
        // Replace this with your actual API call
        const backendApiUrl =
          process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";
        const response = await axios.get(
          `${backendApiUrl}/api/resume/get-resume`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
              // Add this header to bypass ngrok browser warning
              "ngrok-skip-browser-warning": "true",
              // Also add user-agent to make it look like a proper API request
              "User-Agent": "MyApp/1.0",
            },
          },
        );

        if (response.data) {
          get().setData(response.data);
          set((state) => {
            state.originalData = state.formData;
          });
          set({ isInitialDataFetched: true, isLoading: false });
        }
        set({ isLoading: false });
      } catch (error) {
        console.error("Failed to fetch resume data:", error);
        set({
          isLoading: false,
          error: "Failed to load resume data.",
          // Note: Don't set isInitialDataFetched to true on error
          // This allows retry attempts
        });
      }
    },

    saveResume: async (session: Session, resumeId: string | null) => {
      set({ isLoading: true, error: null }); // Can use isLoading or a new 'isSubmitting' state
      try {
        const currentFormData = get().formData;
        const isOriginal = resumeId === null;
        const requestBody = {
          resumeData: currentFormData,
          resumeId,
          isOriginal,
        };

        const backendApiUrl =
          process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

        if (!session || !session.access_token) {
          throw new Error("User session not found. Please log in.");
        }

        const response = await axios.post(
          `${backendApiUrl}/api/resume/save-resume`,
          requestBody,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
              // Add this header to bypass ngrok browser warning
              "ngrok-skip-browser-warning": "true",
              // Also add user-agent to make it look like a proper API request
              "User-Agent": "MyApp/1.0",
            },
          },
        );

        set({ isLoading: false, hasChanges: false });
        Toast.show({
          type: "success",
          text1: "Resume Saved Successfully",
        });
      } catch (err) {
        console.error("Failed to submit resume:", err);
        set({ isLoading: false, error: "Failed to submit resume." });
        Toast.show({
          type: "eToast",
          text1: "Resume Submission Failed",
          text2:
            "An error occurred while submitting your resume. Please try again.",
        });
      }
    },

    improveResumeWithJobDescription: async (
      jobDescription,
      session,
      onComplete: () => void,
    ) => {
      set({ isLoading: true, error: null });
      try {
        set({ progress: 5 });
        const backendApiUrl =
          process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";
        const response = await axios.post(
          `${backendApiUrl}/api/resume/improve-resume`,
          { job_desc: jobDescription }, // Send job_desc in the request body
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              // Add this header to bypass ngrok browser warning
              "ngrok-skip-browser-warning": "true",
              // Also add user-agent to make it look like a proper API request
              "User-Agent": "MyApp/1.0",
            },
          },
        );

        if (response.data && response.data.id && response.data.data) {
          // Assuming the backend returns the newly created improved resume object
          // which has id, data (containing the resume fields), and job_desc at the root
          const newImprovedResume: ResumeFormData = {
            ...initialFormData, // Start with default structure
            ...response.data.data, // Spread the actual resume content
            id: response.data.id, // Explicitly set the top-level ID
            // Ensure nested list items have IDs
            education: ensureListItemsHaveIds(response.data.data.education),
            projects: ensureListItemsHaveIds(response.data.data.projects),
            experience: ensureListItemsHaveIds(response.data.data.experience),
            job_desc: response.data.job_desc, // Get job_desc from the root of response.data
          };
          set((state) => ({
            allResumes: [newImprovedResume, ...state.allResumes], // Add to the beginning of the list
            isLoading: false,
            progress: 100,
          }));
          setTimeout(() => {
            onComplete(); // Execute page-specific logic
            set({ progress: 0 }); // Reset progress after callback
          }, 1500);

          // Inform user about successful improvement
          Toast.show({
            type: "sToast",
            text1: "Success",
            text2: "Resume Improved Successfully",
          });
        } else {
          console.error(
            "Invalid response structure from improve-resume endpoint",
            response.data,
          );
          throw new Error("Invalid data received from improve-resume endpoint");
        }
      } catch (error) {
        console.error("Failed to improve resume:", error);
        set({ isLoading: false, error: "Failed to improve resume." });
        // Consider how to inform the user, perhaps via a toast notification
        Toast.show({
          type: "eToast",
          text1: "Resume Improvement Failed",
          text2: "Unable to improve resume with AI. Please try again later.",
        });
      }
    },

    downloadGeneratedResume: async (resumeId, session) => {
      set({ isLoading: true, error: null });
      try {
        const backendApiUrl =
          process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

        const payload: any = {};
        if (resumeId) {
          payload.resumeId = resumeId;
        }

        const response = await axios.post(
          `${backendApiUrl}/api/resume/generate-resume`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              // Add this header to bypass ngrok browser warning
              "ngrok-skip-browser-warning": "true",
              // Also add user-agent to make it look like a proper API request
              "User-Agent": "MyApp/1.0",
            },
          },
        );

        if (response.data && response.data.pdfUrl) {
          const pdfUrl = response.data.pdfUrl;
          const fileName = `resume-${resumeId || "original"}-${Date.now()}.pdf`;
          await downloadPDFToDevice(pdfUrl, fileName);

          set({ isLoading: false });
        } else {
          throw new Error(
            "PDF URL not found in response from /generate-resume",
          );
        }
      } catch (error: any) {
        console.error("Error in downloadGeneratedResume action:", error);
        set({
          isLoading: false,
          error:
            error.response?.data?.message ||
            error.message ||
            "Failed to generate or download PDF",
        });
      }
    },

    parseResumeFromPDF: async (
      selectedFile: any,
      session: Session,
      onComplete: () => void,
    ) => {
      if (!selectedFile) {
        Toast.show({
          type: "iToast",
          text1: "No File Selected",
          text2: "Please select a PDF file to extract.",
        });
        return { success: false };
      }

      if (!session || !session.access_token) {
        Toast.show({
          type: "eToast",
          text1: "Auth Error",
          text2:
            "You are not signed in or your session is invalid. Please sign in again.",
        });
        return { success: false };
      }

      set({ isLoading: true, error: null });

      try {
        const backendApiUrl =
          process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

        const formData = new FormData();
        // The backend expects the file under the field name 'resume'
        formData.append("resume", {
          uri: selectedFile.uri,
          name: selectedFile.name,
          type: selectedFile.mimeType || "application/pdf", // Ensure a fallback MIME type
        } as any);

        const response = await axios.post(
          `${backendApiUrl}/api/resume/parse-resume`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "multipart/form-data",
              // Add this header to bypass ngrok browser warning
              "ngrok-skip-browser-warning": "true",
              // Also add user-agent to make it look like a proper API request
              "User-Agent": "MyApp/1.0",
            },
          },
        );

        if (response.data) {
          const { jobId } = response.data;
          if (!jobId) {
            Toast.show({
              type: "eToast",
              text1: "Submission Failed",
              text2: "Could not initiate resume parsing job.",
            });
            set({ isLoading: false, error: "Could not initiate job." });
            return { success: false, jobId: null };
          }

          set({ progress: 5 });

          const pollJobStatus = async (currentJobId: string) => {
            try {
              const statusResponse = await axios.get(
                `${backendApiUrl}/api/resume/parse-resume/${currentJobId}`,
                {
                  headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    "ngrok-skip-browser-warning": "true",
                    "User-Agent": "MyApp/1.0",
                  },
                },
              );

              const {
                status,
                data,
                progress,
                error: jobError,
              } = statusResponse.data;

              set({ progress: progress || get().progress });

              if (status === "completed") {
                get().setData(data);
                set((state) => {
                  state.originalData = state.formData;
                });
                Toast.show({
                  type: "sToast",
                  text1: "Extraction Successful",
                  text2:
                    "Resume data has been parsed and loaded into the form.",
                });
                set({ isLoading: false, progress: 100 });

                setTimeout(() => {
                  onComplete();
                  // Handle completion based on pageType
                  set({ progress: 0 });
                }, 1500);
                return { success: true, jobId: currentJobId };
              } else if (status === "failed") {
                Toast.show({
                  type: "eToast",
                  text1: "Extraction Failed",
                  text2: jobError || "The parsing job failed.",
                });
                set({
                  isLoading: false,
                  error: jobError || "The parsing job failed.",
                  progress: 0,
                });
                return { success: false, jobId: currentJobId };
              } else if (
                status === "active" ||
                status === "waiting" ||
                status === "delayed"
              ) {
                // Continue polling
                setTimeout(() => pollJobStatus(currentJobId), 2000); // Poll every 2 seconds
              } else {
                // Unknown status
                Toast.show({
                  type: "eToast",
                  text1: "Parsing Error",
                  text2: `Unknown job status: ${status}`,
                });
                set({
                  isLoading: false,
                  error: `Unknown job status: ${status}`,
                  progress: 0,
                });
                return { success: false, jobId: currentJobId };
              }
            } catch (pollError) {
              console.error("Error polling job status:", pollError);
              let errorMessage =
                "An error occurred while checking parsing status.";
              if (isAxiosError(pollError)) {
                errorMessage =
                  pollError.response?.data?.message ||
                  pollError.message ||
                  errorMessage;
              }
              Toast.show({
                type: "eToast",
                text1: "Polling Error",
                text2: errorMessage,
              });
              set({
                isLoading: false,
                error: `Polling failed: ${errorMessage}`,
                progress: 0,
              });
              return { success: false, jobId: currentJobId };
            }
          };

          pollJobStatus(jobId); // Start polling
          // The function will now return immediately after submitting the job.
          // The UI will update based on polling results.
          // set({ isLoading: false });
          return { success: true, jobId }; // Indicate
        } else {
          Toast.show({
            type: "eToast",
            text1: "Extraction Failed",
            text2: "No data received from server.",
          });
          set({ isLoading: false, error: "No data received from server." });
          return { success: false };
        }
      } catch (error) {
        console.error("Error parsing resume:", error);

        let errorMessage = "An unknown error occurred during parsing.";
        let statusMessage = "";

        if (isAxiosError(error)) {
          const status = error.response?.status || "N/A";
          statusMessage = `Status: ${status}\n`;
          errorMessage =
            error.response?.data?.message || error.message || errorMessage;
        } else {
          errorMessage = (error as Error).message;
        }

        Toast.show({
          type: "eToast",
          text1: "Parsing Request Failed",
          text2: `${statusMessage}Message: ${errorMessage}`,
        });

        set({
          isLoading: false,
          error: `Failed to parse resume: ${errorMessage}`,
        });

        return { success: false };
      }
    },

    resetStore: () => {
      set({
        formData: initialFormData,
        allResumes: [], // Initialize with an empty array
        isLoading: false,
        isSaving: false,
        hasChanges: false,
        isInitialDataFetched: false,
        error: null,
      });
    },

    deleteResume: async (
      resumeId: string,
      session: Session,
    ): Promise<{ success: boolean }> => {
      if (!session || !session.access_token) {
        Toast.show({
          type: "eToast",
          text1: "Authentication Error",
          text2:
            "You are not signed in or your session is invalid. Please sign in again.",
        });
        return { success: false };
      }

      set({ isLoading: true, error: null });

      try {
        const backendApiUrl =
          process.env.EXPO_PUBLIC_API_URL || "URL_ADDRESS:3001";

        const response = await axios.delete(
          `${backendApiUrl}/api/resume/delete-resume/${resumeId}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "ngrok-skip-browser-warning": "true",
              "User-Agent": "MyApp/1.0",
            },
          },
        );
        if (response.status === 200) {
          // Remove the deleted resume from the allResumes array
          set((state) => ({
            allResumes: state.allResumes.filter(
              (resume) => resume.id !== resumeId,
            ),
            isLoading: false,
          }));
          Toast.show({
            type: "sToast",
            text1: "Success",
            text2: "The resume has been deleted successfully",
          });
          return { success: true };
        }
        return { success: false };
      } catch (error) {
        console.error("Error deleting resume:", error);
        Toast.show({
          type: "eToast",
          text1: "Delete Failed",
          text2: "An error occurred while deleting the resume.",
        });
        set({
          isLoading: false,
          error: "Failed to delete resume.",
        });
        return { success: false };
      }
    },
  })),
);
