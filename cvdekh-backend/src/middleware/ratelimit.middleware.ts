import rateLimit from "express-rate-limit";

export const parseResumeRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    error: "Too many resume parsing requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
