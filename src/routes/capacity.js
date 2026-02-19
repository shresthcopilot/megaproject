import express from "express";
import Capacity from "../models/capacity-model.js";
import { authMiddleware } from "../middleware/auth-middleware.js";
// import upload from "../middleware/multer.js"; // agar file upload chahiye

const router = express.Router();

/*  SUBMIT  */
router.post(
  "/submit",
  authMiddleware,
  // upload.single("file"), // enable if using file upload
  async (req, res) => {
    try {
      const p = req.body || {};

      const entry = new Capacity({
        activityName: p.activityName || p.title || "",
        activityType: p.activityType || "",
        year: p.year || "",
        studentsEnrolled: p.students || p.studentsEnrolled || "",
        resourcePerson: p.resourcePerson || "",
        documentLink: p.documentLink || "",
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
      console.error("Capacity submit error", err);
      return res.status(500).json({
        success: false,
        message: "Failed to save capacity entry",
      });
    }
  }
);

/*  LIST  */
router.get("/entries", authMiddleware, async (req, res) => {
  try {
    const q = {};

    if (req.query.programId) {
      q.program_Id = req.query.programId;
    }

    // non-admin → only own entries
    if (req.user.role !== "admin") {
      q.createdBy = req.user.id;
    }

    const docs = await Capacity.find(q).lean();

    return res.json(
      docs.map((d) => ({
        id: d._id.toString(),
        createdAt: d.createdAt,
        ...d,
      }))
    );
  } catch (err) {
    console.error("Capacity entries error", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch capacity entries",
    });
  }
});

/*  READ ONE  */
router.get("/entries/:id", authMiddleware, async (req, res) => {
  try {
    const doc = await Capacity.findById(req.params.id).lean();

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Entry not found",
      });
    }

    if (
      req.user.role !== "admin" &&
      String(doc.createdBy) !== String(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    return res.json({
      id: doc._id.toString(),
      createdAt: doc.createdAt,
      ...doc,
    });
  } catch (err) {
    console.error("Capacity read error", err);
    return res.status(500).json({
      success: false,
      message: "Failed to read capacity entry",
    });
  }
});

export default router;
