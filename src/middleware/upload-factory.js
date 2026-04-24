import multer from "multer";
import path from "path";
import fs from "fs";

const ensureFolder = (folderPath) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
};

export const createUploader = ({
  folder = "misc",
  maxSizeMB = 5,
  allowedExt = [".pdf", ".csv", ".xlsx", ".xls", ".jpg", ".jpeg", ".png"]
}) => {
  const uploadDir = path.join(process.cwd(),"uploads", folder);

  ensureFolder(uploadDir);

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),

    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const base = path
        .basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9_-]/g, "_");

      cb(null, `${base}-${Date.now()}${ext}`);
    }
  });

  const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (!allowedExt.includes(ext)) {
      return cb(new Error("Invalid file type"), false);
    }

    cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxSizeMB * 1024 * 1024
    }
  });
};