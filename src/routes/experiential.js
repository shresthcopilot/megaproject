import express from "express";
import Experiential from "../models/experiential-model.js";
import { authMiddleware } from "../middleware/auth-middleware.js";
// import upload from "../middleware/multer.js";

const router = express.Router();

/* SUBMIT */
router.post(
  "/submit",
  authMiddleware,
  // upload.single("file"),
  async (req, res) => {
    try {
      const p = req.body || {};
      const entry = new Experiential({
        componentType: p.componentType || "",
        objective: p.objective || "",
        coMapped: p.coMapped || "",
        rubrics: p.rubrics || "",
        programmeCode: p.programmeCode || "",
        programmeName: p.programmeName || "",
        courseCode: p.courseCode || "",
        evidenceLink: p.evidenceLink || "",
        reportSubmitted: p.reportSubmitted || "",
        program_Id: p.program_Id || p.programId || p.programmeCode || "",
        uploadedFile: req.file ? req.file.filename : null,
        createdBy: req.user.id,
      });

      const saved = await entry.save();

      return res.status(201).json({
        success: true,
        id: saved._id.toString(),
        uploadedFile: saved.uploadedFile,
      });
    } catch (err) {
      console.error("Experiential submit error", err);
      return res.status(500).json({
        success: false,
        message: "Failed to save experiential entry",
      });
    }
  }
);

/* LIST */
router.get("/entries", authMiddleware, async (req, res) => {
  try {
    let docs;
    if (req.user.role === "ADMIN") {
      docs = await Experiential.find({}).lean();
    } else {
      docs = await Experiential.find({ createdBy: req.user.id }).lean();
    }

    return res.json(
      docs.map((d) => ({ id: d._id.toString(), createdAt: d.createdAt, ...d }))
    );
  } catch (err) {
    console.error("Experiential entries error", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch experiential entries",
    });
  }
});

/* READ ONE  */
router.get("/entries/:id", authMiddleware, async (req, res) => {
  try {
    const doc = await Experiential.findById(req.params.id).lean();

    if (!doc)
      return res.status(404).json({ success: false, message: "Entry not found" });

    if (req.user.role !== "ADMIN" && String(doc.createdBy) !== String(req.user.id))
      return res.status(403).json({ success: false, message: "Forbidden" });

    return res.json({ id: doc._id.toString(), createdAt: doc.createdAt, ...doc });
  } catch (err) {
    console.error("Experiential read error", err);
    return res.status(500).json({ success: false, message: "Failed to read entry" });
  }
});

export default router;
