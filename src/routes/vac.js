import express from "express";
import PcDetailsModel from "../models/pc_model.js";
import mongoose from "mongoose";
import Student from "../models/vac-form-model.js";
import VacEntry from "../models/vac-model.js";
import { authMiddleware } from "../middleware/auth-middleware.js";
import { certificateUpload, brochureUpload} from "../middleware/multer-middleware.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

async function readSubmissions() {
  if (
    !mongoose ||
    !mongoose.connection ||
    mongoose.connection.readyState !== 1
  ) {
    throw new Error("DB not connected");
  }
  const docs = await Student.find({}).lean().exec();
  return docs.map((d) => ({
    id: d._id.toString(),
    createdAt: d.timestamp
      ? new Date(d.timestamp).toISOString()
      : d.createdAt || new Date().toISOString(),
    ...d,
  }));
}

async function readEntries() {
  if (!mongoose || !mongoose.connection || mongoose.connection.readyState !== 1)
    throw new Error("DB not connected");
  const docs = await VacEntry.find({}).lean().exec();
  return docs.map((d) => ({
    id: d._id.toString(),
    createdAt: d.createdAt
      ? new Date(d.createdAt).toISOString()
      : new Date().toISOString(),
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
    createdAt: doc.createdAt
      ? new Date(doc.createdAt).toISOString()
      : new Date().toISOString(),
    ...doc,
  };
}

router.post("/submissions",authMiddleware,certificateUpload.single("certificateUpload"),
  async (req, res) => {
    try {
      const payload = req.body || {};
      if (!payload || Object.keys(payload).length === 0)
        return res.status(400).json({ error: "Empty payload" });

      // require DB
      if (
        !mongoose ||
        !mongoose.connection ||
        mongoose.connection.readyState !== 1
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
        enrollmentNumber:
          payload.enrollmentNumber || payload.enrollmentNo || "",
        phoneNumber: payload.phoneNumber || payload.phone || "",
        courseCompleted: payload.courseCompleted || "",
        sectionSelect: payload.sectionSelect || "",
        courseSelect: payload.courseSelect || "",
        certificateFilename: req.file ? req.file.filename : "",
        certificatePath: req.file
          ? `/uploads/certificates/${req.file.filename}`
          : "",
      });

      try {
        const saved = await doc.save();
        return res.json({ ok: true, id: saved._id.toString() });
      } catch (err) {
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
  },
);

router.get("/submissions", authMiddleware,certificateUpload.single("certificateUpload"), async (req, res) => {
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
      createdAt: d.timestamp
        ? new Date(d.timestamp).toISOString()
        : d.createdAt || new Date().toISOString(),
      ...d,
    }));
    res.json(submissions);
  } catch (err) {
    console.error("Error reading submissions", err);
    res.status(500).json({ error: "Failed to read submissions" });
  }
});
router.get("/download", authMiddleware, async (req, res) => {
  try {
    const submissions = await readSubmissions();

    if (!submissions || submissions.length === 0) {
      return res.status(404).json({ error: "No submissions found" });
    }

    // Set headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="vac_submissions_${Date.now()}.pdf"`,
    );

    const doc = new PDFDocument({
      margin: 40,
      size: "A4",
    });

    // Stream directly to response (production safe)
    doc.pipe(res);

    // Title
    doc
      .fontSize(18)
      .text("VAC Submissions Report", { align: "center" })
      .moveDown(2);

   submissions.forEach((submission, index) => {

  doc.fontSize(14)
     .text(`Submission ${index + 1}`, { underline: true })
     .moveDown(0.5);

  doc.fontSize(12);

  doc.text(`Student Name: ${submission.studentName || "-"}`);
  doc.text(`Department: ${submission.department || "-"}`);
  doc.text(`Level: ${submission.level || "-"}`);
  doc.text(`Course: ${submission.course || "-"}`);
  doc.text(`Semester: ${submission.semester || "-"}`);
  doc.text(`Enrollment Number: ${submission.enrollmentNumber || "-"}`);
  doc.text(`Phone Number: ${submission.phoneNumber || "-"}`);
  doc.text(`Course Completed: ${submission.courseCompleted || "-"}`);
  doc.text(
    `Submitted On: ${
      submission.createdAt
        ? new Date(submission.createdAt).toLocaleString()
        : "-"
    }`
  );

  doc.moveDown(1);

  // =========================
  // CERTIFICATE IMAGE SECTION
  // =========================

  if (submission.certificateFilename) {

    const uploadsDir = path.join(
      process.cwd(),
      "uploads",
      "certificates"
    );

    const fullPath = path.join(
      uploadsDir,
      submission.certificateFilename
    );

    // console.log("Checking certificate:", fullPath);

    if (fs.existsSync(fullPath)) {

      const ext = path.extname(fullPath).toLowerCase();

      if ([".jpg", ".jpeg", ".png"].includes(ext)) {

        doc.text("Certificate:");
        doc.moveDown(0.5);

        doc.image(fullPath, {
          fit: [350, 250],
          align: "left"
        });

        doc.moveDown(1);

      } else if (ext === ".pdf") {

        doc.text("Certificate File (PDF uploaded)");
        doc.text(`File Name: ${submission.certificateFilename}`);
        doc.moveDown(1);

      } else {

        doc.text("Unsupported certificate format.");
        doc.moveDown(1);
      }

    } else {

      doc.text("Certificate file not found on server.");
      doc.moveDown(1);
    }

  } else {

    doc.text("No certificate uploaded.");
    doc.moveDown(1);
  }

  if (index < submissions.length - 1) {
    doc.addPage();
  }

});

    doc.end();
  } catch (err) {
    console.error("Error building PDF", err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});
router.get("/entries/download", authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const students = await Student.find({})
      .select("-_id -vacId -__v") // ✅ remove Mongo fields
      .lean()
      .exec();

    if (!students.length) {
      return res.status(404).json({ error: "No students found" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="vac_students_report_${Date.now()}.pdf"`,
    );

    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
      bufferPages: true,
    });

    doc.pipe(res);

    // ===== TITLE =====
    doc
      .fontSize(20)
      .text("VAC Student Report", { align: "center" })
      .moveDown(1);

    doc
      .fontSize(12)
      .text(`Generated On: ${new Date().toLocaleString()}`)
      .moveDown(2);

    students.forEach((s, index) => {
      doc
        .fontSize(14)
        .text(`Student ${index + 1}`, { underline: true })
        .moveDown(0.5);

      doc.fontSize(12);

      // ✅ Only clean fields
      doc.text(`Program ID: ${s.program_Id || "-"}`);
      doc.text(`Name: ${s.studentName || "-"}`);
      doc.text(`Department: ${s.department || "-"}`);
      doc.text(`Level: ${s.level || "-"}`);
      doc.text(`Course: ${s.course || "-"}`);
      doc.text(`Semester: ${s.semester || "-"}`);
      doc.text(`Enrollment Number: ${s.enrollmentNumber || "-"}`);
      doc.text(`Phone Number: ${s.phoneNumber || "-"}`);
      doc.text(`Course Completed: ${s.courseCompleted || "-"}`);
      doc.text(
        `Submitted On: ${
          s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "-"
        }`,
      );

      doc.moveDown(1);

      // ===== CERTIFICATE SECTION =====
      if (s.certificateFilename) {
        const uploadsDir = path.join(process.cwd(), "uploads", "certificates");

        const fullPath = path.join(uploadsDir, s.certificateFilename);

        if (fs.existsSync(fullPath)) {
          const ext = path.extname(fullPath).toLowerCase();

          // 🖼 IMAGE CERTIFICATE
          if (ext === ".jpg" || ext === ".jpeg" || ext === ".png") {
            doc.text("Certificate:");
            doc.moveDown(0.5);

            doc.image(fullPath, {
              fit: [350, 250],
              align: "left",
            });

            doc.moveDown(1);
          }

          // 📄 PDF CERTIFICATE
          else if (ext === ".pdf") {
            doc.text("Certificate File (PDF Attached Separately):");
            doc.text(`Filename: ${s.certificateFilename}`);
            doc.text("Note: PDF certificates cannot be embedded directly.");
            doc.moveDown(1);
          } else {
            doc.text("Unsupported certificate format.");
          }
        } else {
          doc.text("Certificate file not found on server.");
        }
      } else {
        doc.text("No certificate uploaded.");
      }

      if (index < students.length - 1) {
        doc.addPage();
      }
    });

    // ===== SUMMARY PAGE =====
    doc.addPage();
    doc.fontSize(14).text("Summary", { underline: true }).moveDown(1);

    doc.text(`Total Students: ${students.length}`);

    doc.end();
  } catch (err) {
    console.error("PDF generation error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  }
});
router.get("/entries/:id/download", authMiddleware, async (req, res) => {
  try {

    const id = req.params.id;

    const entry = await VacEntry.findById(id).lean();
   

    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    const user = req.user;
    //   console.log("ENTRY:", entry.programmeCode);
    // console.log("USER:", req.user);

    // ---- ACCESS CONTROL ----

    if (user.role !== "admin") {

      if (user.role !== "pc") {
        return res.status(403).json({ error: "Access denied" });
      }

      // PC can only download their programme VAC
      // allow PC only if they created it
   // find PC details
const pc = await PcDetailsModel.findOne({ createdBy: req.user.id });

if (!pc) {
  return res.status(403).json({ error: "PC not found" });
}

// match programme
if (entry.programmeCode !== pc.programmeCode) {
  return res.status(403).json({ error: "Not allowed for this programme" });
}

    }

    // ---- PDF GENERATION ----

    res.setHeader("Content-Type", "application/pdf");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="vac_entry_${id}.pdf"`
    );

    const doc = new PDFDocument({ margin: 40 });

    doc.pipe(res);

    doc.fontSize(18).text("VAC Entry Report", { align: "center" });

    doc.moveDown();

    doc.fontSize(12);

    doc.text(`Program ID: ${entry.program_Id || "-"}`);
    doc.text(`Programme Code: ${entry.programmeCode || "-"}`);
    doc.text(`Created At: ${new Date(entry.createdAt).toLocaleString()}`);

    doc.moveDown();

    // ---- COURSES ----

    

      doc.fontSize(14).text("Courses:", { underline: true });
      if(entry.courses && entry.courses.length > 0) {

      entry.courses.forEach((c, i) => {

        doc.moveDown(0.5);

        doc.fontSize(12).text(`${i + 1}. ${c.courseName || "-"}`);

        doc.text(`Course Code: ${c.courseCode || "-"}`);
        doc.text(`Duration: ${c.duration || "-"}`);
        doc.text(`Students Enrolled: ${c.studentsEnrolled || "-"}`);
        doc.text(`Students Completed: ${c.studentsCompleted || "-"}`);

      });

    }

    doc.moveDown();

    // ---- BROCHURE IMAGE ----

    if (entry.uploadedFile) {

      const filePath = path.join(
        process.cwd(),
        "uploads",
        "vac-broucher",
        entry.uploadedFile
      );

      if (fs.existsSync(filePath)) {

        doc.addPage();

        doc.fontSize(14).text("Course Brochure");

        const ext = path.extname(filePath).toLowerCase();

        if ([".jpg", ".jpeg", ".png"].includes(ext)) {

          doc.moveDown();

          doc.image(filePath, {
            fit: [400, 400],
            align: "center",
          });

        } else {

          doc.text(`Brochure File: ${entry.uploadedFile}`);

        }

      }

    }

    doc.end();
    // console.log("file" ,entry.uploadedFile);

  } catch (err) {

    console.error("VAC PDF ERROR:", err);

    res.status(500).json({ error: "Failed to generate PDF" });

  }
});
// function toCSV(rows) {
//   if (!Array.isArray(rows) || rows.length === 0) return "";
//   const keys = Array.from(
//     rows.reduce((acc, r) => {
//       Object.keys(r).forEach((k) => acc.add(k));
//       return acc;
//     }, new Set()),
//   );

//   const escape = escapeCsvValue;

//   const header = keys.join(",");

//   const lines = rows.map((r) => keys.map((k) => escape(r[k])).join(","));

//   return [header, ...lines].join("\n");
// }

// function escapeCsvValue(v) {
//   if (v === null || v === undefined) return "";
//   const raw = typeof v === "object" ? JSON.stringify(v) : String(v);
//   return raw.includes(",") || raw.includes("\n") || raw.includes('"')
//     ? '"' + raw.replace(/"/g, '""') + '"'
//     : raw;
// }



// --- entries (VAC section-6) endpoints ---
router.post("/entries", authMiddleware,brochureUpload.single("certificateUpload"), async (req, res) => {
  try {
    const payload = req.body; // should include courses array and metadata
    // if (!payload || Object.keys(payload).length === 0)
    //   return res.status(400).json({ error: "Empty payload" });

    // if (
    //   !mongoose ||
    //   !mongoose.connection ||
    //   mongoose.connection.readyState !== 1
    // )
    //   return res.status(503).json({ error: "DB not connected" });
    //  DEBUG (keep this for now)
    // console.log("BODY:", payload);

    //  FIX: Parse courses safely
    let courses = [];

    if (payload.courses) {
      try {
        courses = JSON.parse(payload.courses);
      } catch (err) {
        console.error("Courses parse error:", err);
      }
    }
    

    const doc = new VacEntry({
      // courses: Array.isArray(payload.courses) ? payload.courses : [],
      courses,
      createdBy: req.user?.id,
      uploadedFile: req.file ? req.file.filename : null,
      programmeCode: payload.programmeCode
        ? String(payload.programmeCode).trim().toUpperCase()
        : payload.programme_code || "",
      program_Id: payload.program_Id || payload.programId || "",
      // department: payload.department 
    });

    const saved = await doc.save();
    res.json({
      ok: true,
      id: saved._id.toString(),
      
      uploadedFilePath: saved.uploadedFile
        ? `/uploads/vac-brochures/${saved.uploadedFile}`
        : null,
        
    });
    // console.log(req.file)
  } catch (err) {
    console.error("Error saving entry", err);
    res.status(500).json({ error: "Failed to save entry" });
  }
});

router.get("/entries", authMiddleware, async (req, res) => {
  try {

    // 1️⃣ ADMIN → see all entries
    if (req.user?.role === "admin") {
      const docs = await VacEntry.find().lean();

      const entries = docs.map((d) => ({
        id: d._id.toString(),
        createdAt: d.createdAt
          ? new Date(d.createdAt).toISOString()
          : new Date().toISOString(),
        ...d,
      }));

      return res.json(entries);
    }


    // 2️⃣ VAC → see only their own entries
    // if (req.user?.role === "vac") {
    //   const docs = await VacEntry.find({
    //     createdBy: req.user.id,
    //   }).lean();

    //   const entries = docs.map((d) => ({
    //     id: d._id.toString(),
    //     createdAt: d.createdAt
    //       ? new Date(d.createdAt).toISOString()
    //       : new Date().toISOString(),
    //     ...d,
    //   }));

    //   return res.json(entries);
    // }


    // 3 PC → see VAC entries based on programmeCode + department
    if (req.user?.role === "pc") {
      // console.log("REQ.USER:", req.user);



     const pc = await PcDetailsModel.findOne({
        createdBy: req.user.id
     }).lean();
    //  console.log("PC DETAILS:", pc);

      if (!pc) {
        return res.json([]);
      }

      const docs = await VacEntry.find({
        programmeCode: pc.programmeCode.trim().toUpperCase(),
        // department: pc.department,
      }).lean();
      // console.log("PC programmeCode:", pc?.programmeCode);

      const entries = docs.map((d) => ({
        id: d._id.toString(),
        createdAt: d.createdAt
          ? new Date(d.createdAt).toISOString()
          : new Date().toISOString(),
        ...d,
      }));
      //  console.log("ENTRIES:", docs.length);

      return res.json(entries);
    }

    // // 4️⃣ If role not allowed
    // return res.status(403).json({ error: "Access denied" });

  } catch (err) {
    console.error("Error reading entries", err);
    res.status(500).json({ error: "Failed to read entries" });
  }
});

router.get("/entries/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const entry = await readEntryById(id);
    if (!entry) return res.status(404).json({ error: "Not found" });

    // enforce owner-only view for non-admins
    // if (
    //   req.user &&
    //   req.user.role !== "admin" &&
    //   String(entry.createdBy || "") !== String(req.user.id)
    // ) {
    //   return res.status(403).json({ error: "Forbidden" });
    // }

    res.json(entry);
  } catch (err) {
    console.error("Error reading entry", err);
    res.status(500).json({ error: "Failed to read entry" });
  }
});

router.delete("/entries/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "Missing id" });

    if (
      !mongoose ||
      !mongoose.connection ||
      mongoose.connection.readyState !== 1
    )
      return res.status(503).json({ error: "DB not connected" });

    // enforce owner or admin

    const entryDoc = await VacEntry.findById(id).exec();
    if (!entryDoc) return res.status(404).json({ error: "Not found" });

    if (
      req.user.role !== "admin" &&
      String(entryDoc.createdBy || "") !== String(req.user.id)
    )
      return res.status(403).json({ error: "Forbidden" });

    const r = await VacEntry.findByIdAndDelete(id).exec();

    if (!r) return res.status(404).json({ error: "Not found" });

    res.json({ ok: true });
  } catch (err) {
    console.error("Error deleting entry", err);
    res.status(500).json({ error: "Failed to delete entry" });
  }
});

// mark entry as sent to program coordinator and attach matching student submissions
router.post("/entries/:id/send", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "Missing id" });

    if (
      !mongoose ||
      !mongoose.connection ||
      mongoose.connection.readyState !== 1
    )
      return res.status(503).json({ error: "DB not connected" });

    const entry = await VacEntry.findById(id).exec();
    if (!entry) return res.status(404).json({ error: "Not found" });

    // only admin or owner can send
    if (
      req.user.role !== "admin" &&
      String(entry.createdBy || "") !== String(req.user.id)
    )
      return res.status(403).json({ error: "Forbidden" });

    // get linked student submissions (submitted with vacId set)

    const matchedStudents = await Student.find({ vacId: id }).lean().exec();

    entry.studentCount = Array.isArray(matchedStudents)
      ? matchedStudents.length
      : 0;
    entry.sentToCoordinator = true;
    entry.sentToCoordinatorAt = new Date();
    await entry.save();

    // Do not attach full students to the entry response to protect privacy
    res.json({ ok: true, id, studentCount: entry.studentCount });
  } catch (err) {
    console.error("Error sending entry", err);
    res.status(500).json({ error: "Failed to send" });
  }
});

// download PDF for all students (admin only)


// download combined CSV for a single entry (courses + students)



router.delete("/submissions/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return;
    res.status(400).json({ error: "Missing id" });

    // require DB connection for deletions

    if (
      !mongoose ||
      !mongoose.connection ||
      mongoose.connection.readyState !== 1
    ) {
      return res.status(503).json({ error: "DB not connected" });
    }

    const stud = await Student.findById(id).exec();
    if (!stud) return res.status(404).json({ error: "Not found" });

    // owner check: if not admin, ensure entry owner matches user
    if (req.user.role !== "admin" && stud.vacId) {
      const entry = await VacEntry.findById(stud.vacId).exec();

      if (!entry || String(entry.createdBy || "") !== String(req.user.id))
        return res.status(403).json({ error: "Forbidden" });
    }

    const r = await Student.findByIdAndDelete(id).exec();

    return res.json({ ok: true });
  } catch (err) {
    console.error("Error deleting submission", err);
    res.status(500).json({ error: "Failed to delete submission" });
  }
});

// mark a submission as sent to program coordinator
router.post("/submissions/:id/send", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "Missing id" });
    // require DB connection
    if (
      !mongoose ||
      !mongoose.connection ||
      mongoose.connection.readyState !== 1
    )
      return res.status(503).json({ error: "DB not connected" });

    const s = await Student.findById(id).exec();

    if (!s) return res.status(404).json({ error: "Not found" });

    // owner check: only admin or owner of the associated entry can send
    if (req.user.role !== "admin" && s.vacId) {
      const entry = await VacEntry.findById(s.vacId).exec();

      if (!entry || String(entry.createdBy || "") !== String(req.user.id))
        return res.status(403).json({ error: "Forbidden" });
    }

    s.sentToCoordinator = true;
    s.sentToCoordinatorAt = new Date().toISOString();
    await s.save();

    res.json({ ok: true, id });
  } catch (err) {
    console.error("Error sending submission", err);
    res.status(500).json({ error: "Failed to mark sent" });
  }
});

export default router;
