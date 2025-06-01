import { create } from "zustand";
import { immer } from "zustand/middleware/immer"; // For easier immutable updates
import axios from "axios"; // Or your preferred HTTP client
import { Session } from "@supabase/supabase-js";
import * as Crypto from "expo-crypto";

// --- TypeScript Interfaces for Resume Data ---
// Inspired by ParsedResumeData from your backend

export interface ContactInfo {
  linkedin?: string;
  github?: string;
  gmail?: string;
  phone?: string;
}

export interface SkillsData {
  languages?: string[];
  frameworks?: string[];
  others?: string[];
}

export interface EducationEntry {
  id?: string; // For list key, can be generated uuid
  institution?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  cgpa?: string;
}

export interface ProjectEntry {
  id?: string; // For list key
  title?: string;
  techStack?: string[];
  details?: string[];
  startDate?: string;
  endDate?: string;
}

export interface ExperienceEntry {
  id?: string; // For list key
  jobTitle?: string;
  company?: string;
  startDate?: string;
  endDate?: string;
  details?: string[];
}

export interface ResumeFormData {
  name?: string;
  summary?: string;
  contactInfo?: ContactInfo;
  skills?: SkillsData;
  education?: EducationEntry[];
  projects?: ProjectEntry[];
  experience?: ExperienceEntry[];
  // Add any other sections you might have
}

// --- Zustand Store Definition ---

const ensureListItemsHaveIds = <T extends { id?: string }>(
  items: T[] | undefined,
): T[] => {
  if (!items || !Array.isArray(items)) return [];

  return items.map((item) => ({
    ...item,
    id: item.id || Crypto.randomUUID(),
  }));
};

const initialFormData: ResumeFormData = {
  name: "",
  summary: "",
  contactInfo: {},
  skills: { languages: [], frameworks: [], others: [] },
  education: [],
  projects: [],
  experience: [],
};
interface ResumeStoreState {
  formData: ResumeFormData;
  isLoading: boolean; // For initial data fetch
  isSaving: boolean; // For auto-save indicator
  isInitialDataFetched: boolean; // For initial data fetch
  error: string | null;

  // Actions
  setInitialData: (data: ResumeFormData) => void;
  updateFormData: <K extends keyof ResumeFormData>(
    section: K,
    data: Partial<ResumeFormData[K]>,
  ) => void;
  addListItem: <K extends "education" | "projects" | "experience">(
    section: K,
    item: K extends "education"
      ? EducationEntry
      : K extends "projects"
      ? ProjectEntry
      : ExperienceEntry,
  ) => void;
  updateListItem: <K extends "education" | "projects" | "experience">(
    section: K,
    itemId: string,
    updatedItem: Partial<
      K extends "education"
        ? EducationEntry
        : K extends "projects"
        ? ProjectEntry
        : ExperienceEntry
    >,
  ) => void;
  removeListItem: <K extends "education" | "projects" | "experience">(
    section: K,
    itemId: string,
  ) => void;
  saveFormData: () => Promise<void>; // This will be debounced in the component
  fetchResumeData: (session: Session) => Promise<void>; // Fetches initial data
  submitFullResume: () => Promise<void>; // Submits all data
}
export const useResumeStore = create<ResumeStoreState>()(
  immer((set, get) => ({
    formData: initialFormData,
    isLoading: false,
    isSaving: false,
    isInitialDataFetched: false,
    error: null,

    setInitialData: (data) => {
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
      });
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
      if (isInitialDataFetched || isLoading) {
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
          // Use your existing setInitialData method
          get().setInitialData(response.data);
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

    submitFullResume: async () => {
      set({ isLoading: true, error: null }); // Can use isLoading or a new 'isSubmitting' state
      try {
        const currentFormData = get().formData;
        console.log("Submitting full resume:", currentFormData);
        // const response = await axios.post('/api/update-resume', currentFormData); // Replace with your actual API endpoint
        // console.log('Resume submitted successfully:', response.data);
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate API call
        set({ isLoading: false });
        // Handle success (e.g., show success message, navigate away)
        alert("Resume submitted successfully!");
      } catch (err) {
        console.error("Failed to submit resume:", err);
        set({ isLoading: false, error: "Failed to submit resume." });
        alert("Error submitting resume. Please try again.");
      }
    },
  })),
);
