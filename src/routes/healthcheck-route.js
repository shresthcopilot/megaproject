import { Router } from "express";
import { healthCheck } from "../controllers/healthcheck.controller.js";

const router = Router();

/* HEALTHCHECK */
router.get("/", healthCheck);

export default router;
