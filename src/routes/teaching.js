import express from "express";
import Teaching from "../models/teaching-model.js";
import { authMiddleware } from "../middleware/auth-middleware.js";

const router = express.Router();

/* CREATE ENTRY */
router.post("/submit", authMiddleware, async (req, res) => {
  try {
    const p = req.body || {};
    const entry = new Teaching({
      pedagogy: p.pedagogy || "",
      mapping: p.mapping || p.mappingText || "",
      evidenceLink: p.evidenceLink || "",
      program_Id: p.program_Id || p.programId || p.programmeCode || "",
      uploadedFile: req.file ? req.file.filename : null,
      createdBy: req.user.id,
    });

    const saved = await entry.save();
    res.status(201).json({ success: true, id: saved._id.toString(), uploadedFile: saved.uploadedFile });
  } catch (err) {
    console.error("Teaching submit error", err);
    res.status(500).json({ success: false, message: "Failed to save teaching entry" });
  }
});

/* LIST ENTRIES */
router.get("/entries", authMiddleware, async (req, res) => {
  try {
    const query = {};
    if (req.query.programId) query.program_Id = req.query.programId;
    if (req.user.role !== "admin") query.createdBy = req.user.id;

    const docs = await Teaching.find(query).lean();
    res.json(docs.map(d => ({ id: d._id.toString(), createdAt: d.createdAt, ...d })));
  } catch (err) {
    console.error("Teaching entries error", err);
    res.status(500).json({ success: false, message: "Failed to fetch teaching entries" });
  }
});

/* GET SINGLE ENTRY */
router.get("/entries/:id", authMiddleware, async (req, res) => {
  try {
    const doc = await Teaching.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });
    if (req.user.role !== "admin" && String(doc.createdBy) !== String(req.user.id))
      return res.status(403).json({ success: false, message: "Forbidden" });

    res.json({ id: doc._id.toString(), createdAt: doc.createdAt, ...doc });
  } catch (err) {
    console.error("Teaching read error", err);
    res.status(500).json({ success: false, message: "Failed to read teaching entry" });
  }
});

export default router;
