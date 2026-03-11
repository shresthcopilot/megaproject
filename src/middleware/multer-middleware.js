import multer from "multer";
import path from "path";
import fs from "fs";

// Create certificates folder inside uploads
const uploadDir = path.join(process.cwd(), "uploads", "certificates");

// Ensure upload folder exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const name = path
            .basename(file.originalname, ext)
            .replace(/\s+/g, "_");

        cb(null, `${name}-${timestamp}${ext}`);
    },
});

export const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = /pdf|docx|doc|jpeg|jpg|png/;
        const ext = path.extname(file.originalname).toLowerCase();

        if (allowed.test(ext)) cb(null, true);
        else cb(new Error("File type not allowed"));
    },
});