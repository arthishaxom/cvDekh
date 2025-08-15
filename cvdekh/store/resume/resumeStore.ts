import * as Crypto from "expo-crypto";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { ensureListItemsHaveIds } from "../../utils/resume.util";
import type { ResumeFormData, ResumeStoreState } from "./types";

const initialFormData: ResumeFormData = {
  id: "",
  name: "",
  summary: "",
  contactInfo: {},
  skills: { languages: [], frameworks: [], others: [] },
  education: [],
  projects: [],
  experience: [],
  certificates: [],
};

export const useResumeStore = create<ResumeStoreState>()(
  immer((set, _get) => ({
    // State only
    formData: initialFormData,
    originalData: null,
    allResumes: [],
    job_desc: null,
    hasChanges: false,
    isInitialDataFetched: false,
    error: null,

    // Pure state operations (keep these)
    setData: (data) => {
      set((state) => {
        const processedData = {
          ...initialFormData,
          ...data,
          education: ensureListItemsHaveIds(data.education),
          projects: ensureListItemsHaveIds(data.projects),
          experience: ensureListItemsHaveIds(data.experience),
        };
        state.formData = processedData;
        state.hasChanges = false;
        state.error = null;
      });
    },

    setOriginalData: (data) => {
      set((state) => {
        state.originalData = data;
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
          Object.assign(sectionData, data);
        } else {
          state.formData[section] = data as any;
        }
        state.hasChanges = true;
      });
    },

    setJobDesc(data) {
      set((state) => {
        state.job_desc = data;
      });
    },

    // Resume collection operations
    setAllResumes: (resumes) => {
      set((state) => {
        state.allResumes = resumes.map((resumeEntry) => ({
          ...initialFormData,
          ...resumeEntry,
          id: resumeEntry.id,
          education: ensureListItemsHaveIds(resumeEntry.education),
          projects: ensureListItemsHaveIds(resumeEntry.projects),
          experience: ensureListItemsHaveIds(resumeEntry.experience),
          job_desc: resumeEntry.job_desc,
        }));
      });
    },

    addToAllResumes: (resumeData) => {
      set((state) => {
        const newResume = {
          ...initialFormData,
          ...resumeData,
          education: ensureListItemsHaveIds(resumeData.education || []),
          projects: ensureListItemsHaveIds(resumeData.projects || []),
          experience: ensureListItemsHaveIds(resumeData.experience || []),
        };
        state.allResumes.unshift(newResume);
      });
    },

    removeFromAllResumes: (resumeId) => {
      set((state) => {
        state.allResumes = state.allResumes.filter(
          (resume) => resume.id !== resumeId
        );
      });
    },

    resetStore: () => {
      set((state) => {
        state.formData = initialFormData;
        state.originalData = null;
        state.allResumes = [];
        state.hasChanges = false;
        state.isInitialDataFetched = false;
        state.error = null;
      });
    },
  }))
);
