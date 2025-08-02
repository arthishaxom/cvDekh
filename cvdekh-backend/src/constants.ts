export const CACHE_KEYS = {
  USER_ORIGINAL_RESUME: (userId: string) => `user:${userId}:original_resume`,
  USER_RESUME: (userId: string, resumeId: string) =>
    `user:${userId}:resume:${resumeId}`,
  USER_ALL_RESUMES: (userId: string) => `user:${userId}:all_resumes`,
  RESUME_BY_ID: (resumeId: string, userId: string) =>
    `resume:${resumeId}:${userId}`,
} as const;

export const CACHE_TTL = {
  RESUME: 900, // 15 minutes
  RESUME_LIST: 300, // 5 minutes
} as const;
