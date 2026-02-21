import express from "express";
import { 
  getConsolidatedData, 
  downloadConsolidatedCSV, 
  getSummary 
} from "../controllers/consolidatedReportController.js";
import { authMiddleware } from "../middleware/auth-middleware.js";

const router = express.Router();

// Get all consolidated data
router.get("/all", authMiddleware, getConsolidatedData);

// Get summary of all forms
router.get("/summary", authMiddleware, getSummary);

// Download consolidated CSV
router.get("/download-csv", authMiddleware, downloadConsolidatedCSV);

export default router;
