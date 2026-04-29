import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
const CERT_LINK_TTL = process.env.CERT_LINK_TTL || "24h";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

export const FILE_DIRS = {
  vac: "vac-broucher",
  pc: "pc-details",
  econtent: "e-content",
  library: "library",
  capacity: "capacity",
};

export function getFolderPath(type) {
  const folder = FILE_DIRS[type];
  if (!folder) return null;
  return path.join(UPLOAD_ROOT, folder);
}

export function createDownloadToken(type, fileName) {
  return jwt.sign(
    { type: "download", formType: type, fileName },
    JWT_SECRET,
    { expiresIn: CERT_LINK_TTL }
  );
}

export function verifyDownloadToken(token, type, fileName) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    return (
      decoded.type === "download" &&
      decoded.formType === type &&
      decoded.fileName === fileName
    );
  } catch {
    return false;
  }
}

export function findFile(type, fileName) {
  const dir = getFolderPath(type);
  if (!dir) return null;

  const filePath = path.join(dir, fileName);

  if (fs.existsSync(filePath)) return filePath;

  return null;
}