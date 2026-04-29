// utils/templateDownloadManager.js

import fs from "fs";
import path from "path";

const TEMPLATE_ROOT = path.join(process.cwd(), "templates");

/**
 * Add new modules here only.
 * Scalable structure:
 * templates/
 *   pc/
 *   vac/
 *   econtent/
 *   library/
 */
const TEMPLATE_MAP = {
  pc: path.join(TEMPLATE_ROOT, "pc"),
  vac: path.join(TEMPLATE_ROOT, "vac"),
  econtent: path.join(TEMPLATE_ROOT, "econtent"),
  library: path.join(TEMPLATE_ROOT, "library"),
};

export function getTemplatePath(moduleName, fileName) {
  const safeModule = String(moduleName || "").toLowerCase().trim();
  const safeFile = path.basename(String(fileName || "").trim());

  const moduleDir = TEMPLATE_MAP[safeModule];

  if (!moduleDir) return null;

  const fullPath = path.join(moduleDir, safeFile);

  if (!fs.existsSync(fullPath)) return null;

  return fullPath;
}