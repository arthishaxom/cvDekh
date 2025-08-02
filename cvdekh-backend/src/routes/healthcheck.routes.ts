import express from "express";
import { healthcheck } from "../controllers/healthcheck.controller";

const router = express.Router();

router.route("/").get(healthcheck);

export default router;
