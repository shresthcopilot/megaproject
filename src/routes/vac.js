import express from "express";
import mongoose from "mongoose";
import Student from "../models/vac-form-model.js";
import VacEntry from "../models/vac-model.js";
import { authMiddleware } from "../middleware/auth-middleware.js";

const router = express.Router();

async function readSubmissions() {
  if (
    !mongoose || !mongoose.connection || mongoose.connection.readyState !== 1
  ) {
    throw new Error("DB not connected");
  }
  const docs = await Student.find({}).lean().exec();
  return docs.map((d) => ({
    id: d._id.toString(),
    createdAt: d
      .timestamp ? new Date(d.timestamp).toISOString() : d.createdAt || new Date().toISOString(), ...d,
  }));
}

async function readEntries() {
  if (!mongoose || !mongoose.connection || mongoose.connection.readyState !== 1)
    throw new Error("DB not connected");
  const docs = await VacEntry.find({}).lean().exec();
  return docs.map((d) => ({
    id: d._id.toString(),
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
    programmeCode: d.programmeCode || "",
    program_Id: d.program_Id || "",
    ...d,
  }));
}

async function readEntryById(id) {
  if (!mongoose || !mongoose.connection || mongoose.connection.readyState !== 1)
    throw new Error("DB not connected");
  const doc = await VacEntry.findById(id).lean().exec();
  if (!doc) return null;
  return {
    id: doc._id.toString(),
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(), ...doc,
  };
}

router.post("/submissions", async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || Object.keys(payload).length === 0)
      return res.status(400).json({ error: "Empty payload" });

    // require DB
    if (
      !mongoose || !mongoose.connection || mongoose.connection.readyState !== 1
    ) {
      return res.status(503).json({ error: "DB not connected" });
    }

    const doc = new Student({
      vacId: payload.vacId || "",
      program_Id: payload.program_Id || payload.programId || "",
      studentName: payload.studentName || "",
      department: payload.department || "",
      level: payload.level || "",
      course: payload.course || payload.courseSelect || "",
      semester: payload.semester ? Number(payload.semester) : "",
      enrollmentNumber: payload.enrollmentNumber || payload.enrollmentNo || "",
      phoneNumber: payload.phoneNumber || payload.phone || "",
      courseCompleted: payload.courseCompleted || "",
      sectionSelect: payload.sectionSelect || "",
      courseSelect: payload.courseSelect || "",
      certificateFilename: payload.certificateFilename || "",
    });

    try {
      const saved = await doc.save();
      return res.json({ ok: true, id: saved._id.toString() });
    }
    catch (err) {
      if (err && err.code === 11000)
        return res.status(409).json({ error: "Duplicate enrollment number" });

      if (err && err.name === "ValidationError")
        return res
          .status(400)
          .json({ error: "Validation Error", details: err.message });

      console.error("Error saving submission to DB", err);

      return res.status(500).json({ error: "Failed to save to DB" });
    }
  } catch (err) {
    console.error("Error saving submission", err);

    res.status(500).json({ error: "Failed to save submission" });
  }
});

router.get("/submissions", authMiddleware, async (req, res) => {
  try {
    if (req.user && req.user.role === "admin") {
      const submissions = await readSubmissions();
      return res.json(submissions);
    }

    // For other users, only return student submissions associated with entries they created
    if (!req.user) return res.status(401).json({ error: "Not authorized" });
    // find all entries created by this user
    const entries = await VacEntry.find({ createdBy: req.user.id }, { _id: 1 })
      .lean()
      .exec();
    const entryIds = entries.map((e) => e._id.toString());
    // find students whose vacId matches any of these entries
    const subs = await Student.find({ vacId: { $in: entryIds } })
      .lean()
      .exec();
    const submissions = subs.map((d) => ({
      id: d._id.toString(),
      createdAt: d.timestamp ? new Date(d.timestamp).toISOString() : d.createdAt || new Date().toISOString(), ...d,
    }));
    res.json(submissions);
  } catch (err) {
    console.error("Error reading submissions", err);
    res.status(500).json({ error: "Failed to read submissions" });
  }
});

function toCSV(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return "";
  const keys = Array.from(
    rows.reduce((acc, r) => {
      Object.keys(r).forEach((k) => acc.add(k));
      return acc;
    }, new Set())
  );

  const escape = escapeCsvValue;

  const header = keys.join(",");

  const lines = rows.map((r) => keys.map((k) => escape(r[k])).join(","));

  return [header, ...lines].join("\n");
}

function escapeCsvValue(v) {
  if (v === null || v === undefined) return "";
  const raw = typeof v === "object" ? JSON.stringify(v) : String(v);
  return raw.includes(",") || raw.includes("\n") || raw.includes('"') ? '"' + raw.replace(/"/g, '""') + '"' : raw;
}

router.get("/download", authMiddleware, async (req, res) => {
  try {
    const submissions = await readSubmissions();
    const csv = toCSV(submissions);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="vac_submissions.csv"'
    );
    res.send(csv);
  } catch (err) {
    console.error("Error building CSV", err);

    res.status(500).json({ error: "Failed to generate CSV" });
  }
});

// --- entries (VAC section-6) endpoints ---
router.post("/entries", authMiddleware, async (req, res) => {
  try {
    const payload = req.body; // should include courses array and metadata
    if (!payload || Object.keys(payload).length === 0)
      return res
        .status(400)
        .json({ error: "Empty payload" });

    if (!mongoose || !mongoose.connection || mongoose.connection.readyState !== 1
    )
      return res
        .status(503)
        .json({ error: "DB not connected" });

    const doc = new VacEntry({
      courses: Array.isArray(payload.courses) ? payload.courses : [],
      createdBy: req.user?.id,
      uploadedFile: req.file ? req.file.filename : null,
      programmeCode: payload.programmeCode ? String(payload.programmeCode).trim().toUpperCase() : (payload.programme_code || ""),
      program_Id: payload.program_Id || payload.programId || "",
    });

    const saved = await doc.save();
    res.json({ ok: true, id: saved._id.toString(), uploadedFile: saved.uploadedFile });
  }
  catch (err) {
    console.error("Error saving entry", err);
    res.status(500).json({ error: "Failed to save entry" });
  }
});

router.get("/entries", authMiddleware, async (req, res) => {
  try {
    // Admins see all entries; other users only see their own created entries
    if (req.user && req.user.role === "admin") {
      const entries = await readEntries();
      return res
        .json(entries);
    }

    // for non-admins, query DB for entries created by the user
    const docs = await VacEntry.find({ createdBy: req.user?.id }).lean().exec();
    const entries = docs.map((d) => ({
      id: d._id.toString(),
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(), ...d,
    }));
    return res
      .json(entries);

  }
  catch (err) {
    console.error("Error reading entries", err);
    res
      .status(500)
      .json({ error: "Failed to read entries" });
  }
});

router.get("/entries/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const entry = await readEntryById(id);
    if (!entry) return res.status(404).json({ error: "Not found" });

    // enforce owner-only view for non-admins
    if (
      req.user &&
      req.user.role !== "admin" &&
      String(entry.createdBy || "") !== String(req.user.id)
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    res.json(entry);
  } catch (err) {
    console.error("Error reading entry", err);
    res
      .status(500)
      .json({ error: "Failed to read entry" });
  }
});

router.delete("/entries/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    if (!id)
      return res
        .status(400)
        .json({ error: "Missing id" });

    if (!mongoose || !mongoose.connection || mongoose.connection.readyState !== 1)
      return res
        .status(503)
        .json({ error: "DB not connected" });

    // enforce owner or admin

    const entryDoc = await VacEntry.findById(id).exec();
    if (!entryDoc)
      return res
        .status(404)
        .json({ error: "Not found" });

    if (
      req.user.role !== "admin" && String(entryDoc.createdBy || "") !== String(req.user.id)
    )
      return res
        .status(403)
        .json({ error: "Forbidden" });

    const r = await VacEntry.findByIdAndDelete(id).exec();

    if (!r)
      return res
        .status(404)
        .json({ error: "Not found" });

    res.json({ ok: true });
  }
  catch (err) {
    console.error("Error deleting entry", err);
    res
      .status(500)
      .json({ error: "Failed to delete entry" });
  }
});

// mark entry as sent to program coordinator and attach matching student submissions
router.post("/entries/:id/send", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    if (!id)
      return res
        .status(400)
        .json({ error: "Missing id" });

    if (!mongoose || !mongoose.connection || mongoose.connection.readyState !== 1)
      return res.status(503).json({ error: "DB not connected" });

    const entry = await VacEntry.findById(id).exec();
    if (!entry)
      return res
        .status(404)
        .json({ error: "Not found" });

    // only admin or owner can send
    if (
      req.user.role !== "admin" &&
      String(entry.createdBy || "") !== String(req.user.id)
    )
      return res
        .status(403)
        .json({ error: "Forbidden" });

    // get linked student submissions (submitted with vacId set)

    const matchedStudents = await Student
      .find({ vacId: id })
      .lean()
      .exec();

    entry.studentCount = Array.isArray(matchedStudents) ? matchedStudents.length : 0;
    entry.sentToCoordinator = true;
    entry.sentToCoordinatorAt = new Date();
    await entry.save();

    // Do not attach full students to the entry response to protect privacy
    res.json({ ok: true, id, studentCount: entry.studentCount });

  }
  catch (err) {
    console.error("Error sending entry", err);
    res
      .status(500)
      .json({ error: "Failed to send" });
  }
});

// download CSV for all entries
router.get("/entries/download", authMiddleware, async (req, res) => {
  try {
    // only admins can download all entries
    if (!req.user || req.user.role !== "admin")
      return res
        .status(403)
        .json({ error: "Forbidden" });

    const entries = await readEntries();

    const csv = toCSV(entries);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="vac_entries.csv"');
    res.send(csv);
  }
  catch (err) {
    console.error("Error building entries CSV", err);

    res
      .status(500)
      .json({ error: "Failed to generate CSV" });
  }
});

// download combined CSV for a single entry (courses + students)
router.get("/entries/:id/download", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;

    const entry = await readEntryById(id);

    if (!entry)
      return res
        .status(404)
        .json({ error: "Not found" });

    // only admin or owner may download per-entry CSV
    if (
      req.user.role !== "admin" &&
      String(entry.createdBy || "") !== String(req.user.id)
    )
      return res
        .status(403)
        .json({ error: "Forbidden" });

    // build two sections: courses and students
    let csvParts = [];
    if (Array.isArray(entry.courses) && entry.courses.length) {
      csvParts.push(
        "section,entryId,createdAt,index,courseName,courseCode,duration,timesOffered,studentsEnrolled,studentsCompleted,brochureLink,coordinator"
      );

      entry.courses.forEach((c, i) => {
        const row = ["VAC",
          entry.id,
          entry.createdAt || "",
          i + 1,
          c.courseName || "",
          c.courseCode || "",
          c.duration || "",
          c.timesOffered || "",
          c.studentsEnrolled || "",
          c.studentsCompleted || "",
          c.brochureLink || "",
          c.coordinator || "",
        ];

        csvParts.push(row.map((v) => escapeCsvValue(v)).join(","));
      });

    }
    else {
      csvParts.push("section,entryId,createdAt,note");
      csvParts.push(
        ["VAC", entry.id, entry.createdAt || "", "no courses"]
          .map((v) => escapeCsvValue(v))
          .join(",")
      );
    }

    // students
    csvParts.push("");
    csvParts.push(
      "section,entryId,createdAt,studentName,enrollmentNumber,phoneNumber,courseSelect,certificateFilename"
    );
    // for per-entry students, query the Student collection for any submissions referencing this entry by vacId
    const students = await Student
      .find({ vacId: id })
      .lean()
      .exec();

    students.forEach((s) => {
      const row = ["STUDENT",
        entry.id,
        entry.createdAt || "",
        s.studentName || "",
        s.enrollmentNumber || "",
        s.phoneNumber || "",
        s.courseSelect || "",
        s.certificateFilename || "",
      ];
      csvParts.push(row.map((v) => escapeCsvValue(v)).join(","));
    });

    const out = csvParts.join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="vac_entry_${id}.csv"`
    );

    res.send(out);

  }
  catch (err) {
    console.error("Error building entry CSV", err);
    res
      .status(500)
      .json({ error: "Failed to generate entry csv" });
  }
});

router.delete("/submissions/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    if (!id)
      return
    res.status(400)
      .json({ error: "Missing id" });

    // require DB connection for deletions

    if (!mongoose || !mongoose.connection || mongoose.connection.readyState !== 1) {
      return res
        .status(503)
        .json({ error: "DB not connected" });
    }

    const stud = await Student.findById(id).exec();
    if (!stud)
      return res
        .status(404)
        .json({ error: "Not found" });

    // owner check: if not admin, ensure entry owner matches user
    if (req.user.role !== "admin" && stud.vacId) {
      const entry = await VacEntry
        .findById(stud.vacId)
        .exec();

      if (!entry || String(entry.createdBy || "") !== String(req.user.id))
        return res
          .status(403)
          .json({ error: "Forbidden" });
    }

    const r = await Student.findByIdAndDelete(id).exec();

    return res
      .json({ ok: true });
  }
  catch (err) {
    console.error("Error deleting submission", err);
    res
      .status(500)
      .json({ error: "Failed to delete submission" });
  }
});

// mark a submission as sent to program coordinator
router.post("/submissions/:id/send", authMiddleware, async (req, res) => {
  try {
    const id = req
      .params
      .id;
    if (!id)
      return res
        .status(400)
        .json({ error: "Missing id" });
    // require DB connection
    if (!mongoose || !mongoose.connection || mongoose.connection.readyState !== 1
    )
      return res
        .status(503)
        .json({ error: "DB not connected" });

    const s = await Student.findById(id).exec();

    if (!s)
      return res
        .status(404)
        .json({ error: "Not found" });

    // owner check: only admin or owner of the associated entry can send
    if (req.user.role !== "admin" && s.vacId) {
      const entry = await VacEntry
        .findById(s.vacId)
        .exec();

      if (!entry || String(entry.createdBy || "") !== String(req.user.id))
        return res
          .status(403)
          .json({ error: "Forbidden" });
    }

    s.sentToCoordinator = true;
    s.sentToCoordinatorAt = new Date().toISOString();
    await s.save();

    res.json({ ok: true, id });
  }
  catch (err) {
    console.error("Error sending submission", err);
    res
      .status(500)
      .json({ error: "Failed to mark sent" });
  }
});

export default router;
