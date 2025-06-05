import { create } from "zustand";
import { immer } from "zustand/middleware/immer"; // For easier immutable updates
import axios from "axios"; // Or your preferred HTTP client
import { Session } from "@supabase/supabase-js";
import * as Crypto from "expo-crypto";
import { JobDetails, ResumeFormData, ResumeStoreState } from "./types";
import { downloadPDFToDevice, ensureListItemsHaveIds } from "./utils";

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
    allResumes: [], // Initialize with an empty array
    isLoading: false,
    isSaving: false,
    hasChanges: false,
    isInitialDataFetched: false,
    error: null,

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
          // console.log("Successfully fetched all resumes:", formattedResumes);
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

    saveFormData: async () => {
      set({ isSaving: true, error: null });
      console.log("Simulating auto-save with current data:", get().formData);
      // Replace with actual API call to save draft if needed
      // For example: await axios.post('/api/resume/save-draft', get().formData);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay
      set({ isSaving: false });
      // Handle success/error from API call here
    },

    fetchResumeData: async (session: Session) => {
      // Critical: Check if already fetched or currently loading
      const { isInitialDataFetched, isLoading } = get();
      if (isLoading || isInitialDataFetched) {
        console.log("Data already fetched or currently loading, skipping...");
        return; // Exit early - this prevents multiple API calls
      }

      set({ isLoading: true, error: null });

      try {
        // Replace this with your actual API call
        const backendApiUrl =
          process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";
        const response = await axios.get(
          `${backendApiUrl}/api/resume/get-resume`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "multipart/form-data",
            },
          },
        );

        if (response.data) {
          // Use your existing setData method
          get().setData(response.data);
          console.log("Successfully fetched and set resume data");
          set({ isInitialDataFetched: true }); // Set this flag after successful fetch
        }
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

    submitFullResume: async (session: Session) => {
      set({ isLoading: true, error: null }); // Can use isLoading or a new 'isSubmitting' state
      try {
        const currentFormData = get().formData;
        console.log("Submitting full resume:", currentFormData);

        const backendApiUrl =
          process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

        if (!session || !session.access_token) {
          throw new Error("User session not found. Please log in.");
        }

        const response = await axios.post(
          `${backendApiUrl}/api/resume/save-resume`,
          currentFormData,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
          },
        );

        console.log("Resume submitted successfully:", response.data);
        set({ isLoading: false, hasChanges: false });
        alert("Resume submitted successfully!");
      } catch (err) {
        console.error("Failed to submit resume:", err);
        set({ isLoading: false, error: "Failed to submit resume." });
        alert("Error submitting resume. Please try again.");
      }
    },

    improveResumeWithJobDescription: async (jobDescription, session) => {
      set({ isLoading: true, error: null });
      try {
        const backendApiUrl =
          process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";
        const response = await axios.post(
          `${backendApiUrl}/api/resume/improve-resume`,
          { job_desc: jobDescription }, // Send job_desc in the request body
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
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
          }));
          console.log(
            "Successfully improved resume and added to store:",
            newImprovedResume,
          );
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
        alert(
          "Failed to improve resume. Please check the console for details.",
        );
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

        console.log("Payload for /generate-resume:", payload);

        const response = await axios.post(
          `${backendApiUrl}/api/resume/generate-resume`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          },
        );

        console.log("Response from /generate-resume endpoint:", response.data);

        if (response.data && response.data.pdfUrl) {
          const pdfUrl = response.data.pdfUrl;
          const fileName = `resume-${resumeId || "original"}-${Date.now()}.pdf`;
          console.log("PDF URL for download:", pdfUrl);

          // Call the new download function instead of Linking.openURL
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
  })),
);
