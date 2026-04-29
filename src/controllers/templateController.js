// controllers/templateController.js

import path from "path";
import { getTemplatePath } from "../utils/templatedownload.js";

export const downloadTemplate = async (req, res) => {
  try {
    const { moduleName, fileName } = req.params;

    const filePath = getTemplatePath(moduleName, fileName);

    if (!filePath) {
      return res.status(404).json({
        success: false,
        message: "Template file not found",
      });
    }

    return res.download(filePath, path.basename(filePath));
  } catch (error) {
    console.error("Template Download Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to download template",
    });
  }
};