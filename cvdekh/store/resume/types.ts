import type { Session } from "@supabase/supabase-js";
import type { DocumentPickerAsset } from "expo-document-picker";

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
  techStack?: string[] | string;
  details?: string[] | string;
  startDate?: string;
  endDate?: string;
}

export interface ExperienceEntry {
  id?: string; // For list key
  jobTitle?: string;
  company?: string;
  startDate?: string;
  endDate?: string;
  details?: string[] | string;
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

export interface CertificateEntry {
  id?: string;
  name: string;
  company: string;
  issueDate: string;
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
  certificates?: CertificateEntry[];
}

export interface ResumeEntry {
  id: string;
  data: ResumeFormData;
  is_original: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  job_desc: JobDetails;
}

export interface ResumeStoreState {
  // State
  formData: ResumeFormData;
  originalData: ResumeFormData | null;
  job_desc: JobDetails | null;
  allResumes: ResumeEntry[]; // To hold all resumes fetched from the backend
  hasChanges: boolean; // For auto-save indicator
  isInitialDataFetched: boolean; // For initial data fetch
  error: string | null;

  // Pure state actions only (no async operations)
  setData: (data: ResumeFormData) => void;
  setOriginalData: (data: ResumeFormData) => void;
  setJobDesc: (data: JobDetails) => void;
  updateFormData: <K extends keyof ResumeFormData>(
    section: K,
    data: Partial<ResumeFormData[K]>
  ) => void;
  setAllResumes: (resumes: ResumeEntry[]) => void;
  addToAllResumes: (resumeData: ResumeEntry) => void;
  removeFromAllResumes: (resumeId: string) => void;

  // Reset
  resetStore: () => void;
}

// Hook return types for the new architecture
export interface UseResumeOperationsReturn {
  isLoading: boolean;
  progress: number;
  saveResume: (
    session: Session,
    resumeId: string | null,
    formData: ResumeFormData
  ) => Promise<void>;
  improveResume: (
    session: Session,
    jobDescription: string,
    onComplete?: () => void
  ) => Promise<void>;
  deleteResume: (
    session: Session,
    resumeId: string
  ) => Promise<{ success: boolean }>;
  downloadResume: (session: Session, resumeId?: string) => Promise<void>;
}

export interface UseResumeParserReturn {
  isLoading: boolean;
  progress: number;
  parseResume: (
    session: Session,
    selectedFile: DocumentPickerAsset,
    onComplete?: () => void
  ) => Promise<{ success: boolean }>;
}

export interface UseResumeDataReturn {
  isLoading: boolean;
  error: string | null;
  fetchOriginalResume: () => Promise<void>;
  fetchAllResumes: () => Promise<void>;
  refetch: () => void;
}

// API layer types
export interface SaveResumePayload {
  resumeData: ResumeFormData;
  resumeId: string | null;
  isOriginal: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ParseResumeResponse {
  jobId: string;
  message: string;
}

export interface JobStatusResponse {
  status: "waiting" | "active" | "completed" | "failed" | "delayed";
  data?: ResumeFormData;
  progress?: number;
  error?: string;
}

export interface ImproveResumeResponse {
  id: string;
  data: ResumeFormData;
  job_desc: JobDetails;
}

export interface GeneratePDFResponse {
  pdfUrl: string;
  message: string;
}
