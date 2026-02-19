import express from "express";
import EContent from "../models/econtent-model.js";
import { authMiddleware } from "../middleware/auth-middleware.js";
// import upload from "../middleware/multer.js"; // enable if file upload

const router = express.Router();

/*  SUBMIT  */
router.post(
  "/submit",
  authMiddleware,
  // upload.single("file"),
  async (req, res) => {
    try {
      const p = req.body || {};

      const entry = new EContent({
        faculty: p.faculty || p.facultyName || "",
        moduleName: p.module || p.moduleName || "",
        platform: p.platform || "",
        dateOfLaunch: p.dateOfLaunch || "",
        link: p.link || "",
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
      console.error("EContent submit error", err);
      return res.status(500).json({
        success: false,
        message: "Failed to save econtent",
      });
    }
  }
);

/*  LIST  */
router.get("/entries", authMiddleware, async (req, res) => {
  try {
    const q = {};
    if (req.query.programId) q.program_Id = req.query.programId;

    // non-admin → only own entries
    if (req.user.role !== "admin") q.createdBy = req.user.id;

    const docs = await EContent.find(q).lean();

    return res.json(
      docs.map((d) => ({
        id: d._id.toString(),
        createdAt: d.createdAt,
        ...d,
      }))
    );
  } catch (err) {
    console.error("EContent entries error", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch econtent entries",
    });
  }
});

/*  READ ONE  */
router.get("/entries/:id", authMiddleware, async (req, res) => {
  try {
    const doc = await EContent.findById(req.params.id).lean();

    if (!doc)
      return res.status(404).json({ success: false, message: "Entry not found" });

    if (req.user.role !== "admin" && String(doc.createdBy) !== String(req.user.id))
      return res.status(403).json({ success: false, message: "Forbidden" });

    return res.json({
      id: doc._id.toString(),
      createdAt: doc.createdAt,
      ...doc,
    });
  } catch (err) {
    console.error("EContent read error", err);
    return res.status(500).json({ success: false, message: "Failed to read econtent entry" });
  }
});

export default router;
