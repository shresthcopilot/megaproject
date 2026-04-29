// routes/templateRoutes.js

import express from "express";
import { downloadTemplate } from "../controllers/templateController.js";
import { authMiddleware } from "../middleware/auth-middleware.js";

const router = express.Router();

/**
 * @route GET /api/templates/:moduleName/:fileName
 * @desc Download a template file for a specific module
 * @access Private (requires authentication)
 *
 * Example: To download the "programme-coordinator.xlsx" template for the "pc"
 * /api/templates/pc/programme-coordinator.xlsx
 */

router.get(
  "/:moduleName/:fileName",
  authMiddleware,
  downloadTemplate
);

export default router;