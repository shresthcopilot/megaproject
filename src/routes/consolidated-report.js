import express from "express";
import {
  getConsolidatedData,
  // downloadConsolidatedCSV,
  getSummary,
  downloadPDF,
  downloadConsolidatedExcel,
  downloadCertificateFile,
} from "../controllers/consolidatedReportController.js";
import { authMiddleware, optionalAuth } from "../middleware/auth-middleware.js";

const router = express.Router();

// Get all consolidated data
router.get("/all", authMiddleware, getConsolidatedData);

// Get summary of all forms
router.get("/summary", authMiddleware, getSummary);

// Download consolidated PDF report
router.post("/download-pdf", authMiddleware, downloadPDF);
// Download consolidated Excel report
router.get("/download-excel", authMiddleware, downloadConsolidatedExcel);
// Download VAC / PC certificate files with original filename
router.get("/certificate/:formType/:fileName",optionalAuth,downloadCertificateFile);

export default router;
