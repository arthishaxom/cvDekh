import express from "express";
import {
  deleteResume,
  generateResumePdf,
  getParseResumeStatus,
  getPdfGenerationStatus,
  getResume,
  getResumes,
  improveResume,
  parseResume,
  saveResume,
} from "../controllers/resume.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { resumeUpload } from "../middleware/multer.middleware";
import { parseResumeRateLimit } from "../middleware/ratelimit.middleware";

const router = express.Router();

router.use(authMiddleware);

//! Endpoint to parse resume
router
  .route("/parse")
  .post(parseResumeRateLimit, resumeUpload.single("resume"), parseResume);

//! Endpoint to check job status
router.route("/parse/:jobId").get(getParseResumeStatus);

//! Endpoint to generate PDF of resume
router.route("/pdf{/:resumeId}").get(generateResumePdf);

//! Endpoint to check pdf status
router.route("/pdf/status/:jobId").get(getPdfGenerationStatus);

//! Endpoint to get original resume
router.route("/original").get(getResume);

//! Endpoint to improve a resume
router.route("/improve").post(improveResume);

//! Endpoint to save a resume
router.route("/").post(express.json(), saveResume);

//! Endpoint to get all resumes
router.route("/").get(getResumes);

//! Endpoint to delete a resume
router.route("/:resumeId").delete(deleteResume);

export default router;
