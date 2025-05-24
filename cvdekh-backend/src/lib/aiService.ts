export interface AIService {
  parseResume(resumeText: string): Promise<ParsedResumeData>;
}

export interface ParsedResumeData {
  name: string;
  summary: string;
  contactInfo: {
    linkedin: string;
    github: string;
    gmail: string;
    phone: string;
  };
  skills: {
    languages: string[];
    frameworks: string[];
    others: string[];
  };
  education: Array<{
    institution: string;
    field: string;
    startDate: string;
    endDate: string;
    cgpa: string;
  }>;
  projects: Array<{
    title: string;
    techStack: string[];
    details: string[];
    startDate: string;
    endDate: string;
  }>;
  experience: Array<{
    jobTitle: string;
    company: string;
    startDate: string;
    endDate: string;
    details: string[];
  }>;
}
