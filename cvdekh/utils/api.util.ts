// lib/api/resume.api.ts

import type { Session } from "@supabase/supabase-js";
import axios from "axios";
import type { ResumeFormData } from "@/store/resume/types";

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

const createHeaders = (session: Session) => ({
  Authorization: `Bearer ${session.access_token}`,
  "ngrok-skip-browser-warning": "true",
  "User-Agent": "MyApp/1.0",
});

export const resumeApi = {
  getOriginalResume: async (session: Session) => {
    const { data } = await axios.get(`${API_BASE}/api/v1/resumes/original`, {
      headers: {
        ...createHeaders(session),
        "Content-Type": "application/json",
      },
    });
    return data.data;
  },

  getAllResumes: async (session: Session) => {
    const { data } = await axios.get(`${API_BASE}/api/v1/resumes`, {
      headers: createHeaders(session),
    });

    return data.data.resumes;
  },

  saveResume: async (
    session: Session,
    payload: {
      resumeData: ResumeFormData;
      resumeId: string | null;
      isOriginal: boolean;
    }
  ) => {
    const { data } = await axios.post(`${API_BASE}/api/v1/resumes`, payload, {
      headers: {
        ...createHeaders(session),
        "Content-Type": "application/json",
      },
    });
    return data;
  },

  improveResume: async (session: Session, jobDescription: string) => {
    const { data } = await axios.post(
      `${API_BASE}/api/v1/resumes/improve`,
      { job_desc: jobDescription },
      { headers: createHeaders(session) }
    );
    return data;
  },

  parseResume: async (session: Session, formData: FormData) => {
    const { data } = await axios.post(
      `${API_BASE}/api/v1/resumes/parse`,
      formData,
      {
        headers: {
          ...createHeaders(session),
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return data;
  },

  getJobStatus: async (session: Session, jobId: string) => {
    const { data } = await axios.get(
      `${API_BASE}/api/v1/resumes/parse/${jobId}`,
      {
        headers: createHeaders(session),
      }
    );
    return data;
  },

  generatePDF: async (session: Session, resumeId?: string) => {
    const url = resumeId
      ? `${API_BASE}/api/v1/resumes/pdf/${resumeId}`
      : `${API_BASE}/api/v1/resumes/pdf`;
    const { data } = await axios.get(url, {
      headers: createHeaders(session),
    });

    return data;
  },

  getPDFJobStatus: async (session: Session, jobId: string) => {
    const { data } = await axios.get(
      `${API_BASE}/api/v1/resumes/pdf/status/${jobId}`,
      {
        headers: createHeaders(session),
      }
    );
    return data;
  },

  deleteResume: async (session: Session, resumeId: string) => {
    const { data } = await axios.delete(
      `${API_BASE}/api/v1/resumes/${resumeId}`,
      {
        headers: createHeaders(session),
      }
    );
    return data;
  },
};
