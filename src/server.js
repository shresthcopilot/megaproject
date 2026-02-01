import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import connectDB from "./db/index.js";
import authRoutes from "./routes/auth.js";
import vacRoutes from "./routes/vac.js";
import pcRoutes from "./routes/pc.js";
import econtentRoutes from "./routes/econtent.js";
import capacityRoutes from "./routes/capacity.js";
import teachingRoutes from "./routes/teaching.js";
import experientialRoutes from "./routes/experiential.js";
import libraryRoutes from "./routes/library.js";
import learnerRoutes from "./routes/learner-support.js";
import { errorHandler, notFoundHandler } from "./middleware/index.js";



import Student from "./models/vac-form-model.js";
import VacEntry from "./models/vac-model.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.use("/api/auth", authRoutes);

import { pageAuthMiddleware} from "./middleware/pageAuthMiddleware.js";
app.use("/api/register", pageAuthMiddleware, authRoutes);


app.use("/api/vac", pageAuthMiddleware, vacRoutes);
app.use("/api/pc", pageAuthMiddleware, pcRoutes);
app.use("/api/econtent", pageAuthMiddleware, econtentRoutes);
app.use("/api/capacity", pageAuthMiddleware, capacityRoutes);
app.use("/api/teaching", pageAuthMiddleware, teachingRoutes);
app.use("/api/experiential", pageAuthMiddleware, experientialRoutes);
app.use("/api/library", pageAuthMiddleware, libraryRoutes);
app.use("/api/learner-support", pageAuthMiddleware, learnerRoutes);


// DB status endpoint
app.get("/api/db/status", async (req, res) => {
  try {
    const ready = Student.db.readyState === 1;
    let studentCount = null;
    let entryCount = null;
    if (ready) {
      studentCount = await Student.countDocuments({});
      entryCount = await VacEntry.countDocuments({});
    }
    res.json({ ok: true, ready, studentCount, entryCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Failed" });
  }
});

// 404 & global error handler
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
