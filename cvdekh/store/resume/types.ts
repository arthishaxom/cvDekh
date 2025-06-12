import { Session } from "@supabase/supabase-js";

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

export interface JobDetails {
  jobTitle?: string;
  company?: string;
  location?: string;
  type?: string;
  skills?: string[];
  stipend?: string;
  matchScore?: string;
  improvementsORSuggestions?: string[];
}

export interface ResumeFormData {
  id?: string;
  name?: string;
  summary?: string;
  contactInfo?: ContactInfo;
  skills?: SkillsData;
  education?: EducationEntry[];
  projects?: ProjectEntry[];
  experience?: ExperienceEntry[];
  job_desc?: JobDetails;
  // Add any other sections you might have
}

export interface ResumeStoreState {
  formData: ResumeFormData;
  originalData: ResumeFormData | null;
  allResumes: ResumeFormData[]; // To hold all resumes fetched from the backend
  isLoading: boolean; // For initial data fetch
  isSaving: boolean; // For auto-save indicator
  isInitialDataFetched: boolean; // For initial data fetch
  hasChanges: boolean; // For auto-save indicator
  error: string | null;
  progress: number;

  // Actions
  setData: (data: ResumeFormData) => void;
  fetchAllResume: (session: Session) => Promise<void>; // Fetches initial data
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
  fetchResumeData: (session: Session) => Promise<void>; // Fetches initial data
  saveResume: (session: Session, resumeId: string | null) => Promise<void>; // Submits all data
  deleteResume: (
    resumeId: string,
    session: Session,
  ) => Promise<{ success: boolean }>; // Deletes the resume
  improveResumeWithJobDescription: (
    jobDescription: string,
    session: Session,
    onComplete: () => void,
  ) => Promise<void>;
  downloadGeneratedResume: (
    resumeId: string | null, // Pass null to download the original resume
    session: Session,
  ) => Promise<void>;
  parseResumeFromPDF: (
    selectedFile: any,
    session: Session,
    onComplete: () => void,
  ) => Promise<{ success: boolean }>;
  resetStore: () => void;
}
