import express from "express";
import LearnerSupport from "../models/learnerSupport-model.js";
import { authMiddleware } from "../middleware/auth-middleware.js";

const router = express.Router();

/* CREATE ENTRY  */
router.post("/submit", authMiddleware, async (req, res) => {
  try {
    const p = req.body || {};
    const entry = new LearnerSupport({
      criteriaUsed: p.criteriaUsed || "",
      slowLearnersCount: p.slowLearnersCount || 0,
      advancedLearnersCount: p.advancedLearnersCount || 0,
      outcome: p.outcome || "",
      measuresTaken: p.measuresTaken || "",
      programmeCode: p.programmeCode || "",
      programmeName: p.programmeName || "",
      courseCode: p.courseCode || "",
      evidenceLink: p.evidenceLink || "",
      program_Id: p.program_Id || p.programId || p.programmeCode || "",
      uploadedFile: req.file ? req.file.filename : null,
      createdBy: req.user?.id,
    });
    const saved = await entry.save();
    res.status(201).json({ ok: true, id: saved._id.toString(), uploadedFile: saved.uploadedFile });
  } catch (err) {
    console.error("Learner submit error", err);
    res.status(500).json({ error: "Failed to save learner support entry" });
  }
});

/* LIST ENTRIES */
router.get("/entries", authMiddleware, async (req, res) => {
  try {
    const query = {};
    if (req.query.programId) query.program_Id = req.query.programId;
    if (req.user.role !== "admin") query.createdBy = req.user?.id;

    const docs = await LearnerSupport.find(query).lean().exec();
    res.json(docs.map(d => ({ id: d._id.toString(), createdAt: d.createdAt, ...d })));
  } catch (err) {
    console.error("Learner entries error", err);
    res.status(500).json({ error: "Failed to fetch learner support entries" });
  }
});

/* GET SINGLE ENTRY */
router.get("/entries/:id", authMiddleware, async (req, res) => {
  try {
    const doc = await LearnerSupport.findById(req.params.id).lean().exec();
    if (!doc) return res.status(404).json({ error: "Not found" });
    if (req.user.role !== "admin" && String(doc.createdBy) !== String(req.user.id))
      return res.status(403).json({ error: "Forbidden" });

    res.json({ id: doc._id.toString(), createdAt: doc.createdAt, ...doc });
  } catch (err) {
    console.error("Learner read error", err);
    res.status(500).json({ error: "Failed to read learner support entry" });
  }
});

export default router;
