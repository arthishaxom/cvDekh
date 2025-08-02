import express from "express";
import { getSkills } from "../controllers/skills.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

router.use(authMiddleware);

router.route("/").get(getSkills);

export default router;
