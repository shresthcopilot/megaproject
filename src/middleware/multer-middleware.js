import multer from "multer";
import path from "path";
import fs from "fs";

/* ==============================
   STUDENT CERTIFICATE UPLOAD
============================== */

const certificateDir = path.join(process.cwd(), "uploads", "certificates");

if (!fs.existsSync(certificateDir)) {
  fs.mkdirSync(certificateDir, { recursive: true });
}

const certificateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, certificateDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, "_");

    cb(null, `${name}-${timestamp}${ext}`);
  },
});

export const certificateUpload = multer({
  storage: certificateStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter,
});

/* ==============================
   VAC BROUCHER UPLOAD
============================== */

const brochureDir = path.join(process.cwd(), "uploads", "vac-broucher");

if (!fs.existsSync(brochureDir)) {
  fs.mkdirSync(brochureDir, { recursive: true });
}

const brochureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, brochureDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, "_");

    cb(null, `${name}-${timestamp}${ext}`);
  },
});

export const brochureUpload = multer({
  storage: brochureStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter,
});
/* ==============================
   PC DETAILS UPLOAD
============================== */
const pcDetailsDir = path.join(process.cwd(), "uploads", "pc-details");

if (!fs.existsSync(pcDetailsDir)) {
  fs.mkdirSync(pcDetailsDir, { recursive: true });
}
const pcDetailsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pcDetailsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, "_");

    cb(null, `${name}-${timestamp}${ext}`);
  },
});

export const pcDetailsUpload = multer({
  storage: pcDetailsStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter,
});


/* ==============================
   FILE VALIDATION
============================== */

function fileFilter(req, file, cb) {
  const allowed = /pdf|csv|excel|docx|doc|jpeg|jpg|png/;
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowed.test(ext)) cb(null, true);
  else cb(new Error("File type not allowed"));
}