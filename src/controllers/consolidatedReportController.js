import mongoose from "mongoose";
import VacEntry from "../models/vac-model.js";
import Library from "../models/library-model.js";
import EContent from "../models/econtent-model.js";
import Capacity from "../models/capacity-model.js";
import Teaching from "../models/teaching-model.js";
import Experiential from "../models/experiential-model.js";
import LearnerSupport from "../models/learnerSupport-model.js";
import PcDetails from "../models/pc_model.js";
import path from "path";
import PDFDocument from "pdfkit";
import fs from "fs";
import ExcelJs from "exceljs";
import jwt from "jsonwebtoken";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
const CERT_LINK_TTL = process.env.CERT_LINK_TTL || "24h";
const CERTIFICATE_DIRS = {
  vac: [path.join(UPLOAD_ROOT, "vac-broucher")],
  pc: [
    path.join(UPLOAD_ROOT, "pc-file"),
    path.join(UPLOAD_ROOT, "pc"),
    path.join(UPLOAD_ROOT, "pc-certificate"),
    path.join(UPLOAD_ROOT, "vac-broucher")
  ]
};

function createCertificateDownloadToken(formType, fileName) {
  return jwt.sign(
    { type: "certificate_download", formType, fileName },
    JWT_SECRET,
    { expiresIn: CERT_LINK_TTL }
  );
}

function verifyCertificateDownloadToken(token, formType, fileName) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return (
      decoded &&
      decoded.type === "certificate_download" &&
      decoded.formType === formType &&
      decoded.fileName === fileName
    );
  } catch {
    return false;
  }
}

function buildProgramIdFilter(programId) {
  if (!programId) return {};
  return {
    $or: [
      { program_Id: { $regex: programId, $options: "i" } },
      { programId: { $regex: programId, $options: "i" } }
    ]
  };
}

function normalizeSemester(semester) {
  if (semester === undefined || semester === null || semester === "") return semester;
  const parsed = Number(semester);
  return Number.isNaN(parsed) ? semester : parsed;
}

function buildFilter({
  programId,
  semester,
  department,
  academicYear,
  includeProgramId = true,
  includeSemester = true,
  includeDepartment = true,
  includeAcademicYear = false
}) {
  const filter = includeProgramId ? buildProgramIdFilter(programId) : {};

  if (includeSemester && semester) {
    const normalizedSemester = normalizeSemester(semester);
    // Support collections where semester is stored as number in some docs and string in others.
    filter.semester = {
      $in: [normalizedSemester, String(semester)]
    };
  }
  if (includeDepartment && department) {
    filter.department = department;
  }
  if (includeAcademicYear && academicYear) {
    filter.academicYear = academicYear;
  }

  return filter;
}

// ✅ NEW FUNCTION for pdf generation - combines all form data into a single PDF report


export const generateEnhancedPDF = async (res, data) => {
  try {
    const { summary = {}, vacData = [], pcData = [] } = data || {};

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=report.pdf");

    doc.pipe(res);

    // =========================
    // 🎯 HEADER
    // =========================
    doc
      .fontSize(22)
      .fillColor("#2c3e50")
      .text("ERP Consolidated Report", { align: "center" });

    doc.moveDown(0.5);

    doc
      .fontSize(10)
      .fillColor("gray")
      .text(`Generated on: ${new Date().toLocaleString()}`, {
        align: "center",
      });

    doc.moveDown(1.5);

    // =========================
    // 📊 SUMMARY GRID
    // =========================
    const drawBox = (x, y, label, value) => {
      doc.rect(x, y, 130, 55).fillAndStroke("#f4f6f7", "#d5d8dc");

      doc.fillColor("#2c3e50").fontSize(11).text(label, x + 10, y + 10);

      doc.fillColor("#2980b9").fontSize(18).text(value || 0, x + 10, y + 28);
    };

    let startX = 40;
    let startY = doc.y;

    const boxes = [
      ["VAC", summary.vac],
      ["Library", summary.library],
      ["E-Content", summary.econtent],
      ["Capacity", summary.capacity],
      ["Teaching", summary.teaching],
      ["Experiential", summary.experiential],
      ["Support", summary.learnerSupport],
      ["PC", summary.pc],
      ["TOTAL", summary.total],
    ];

    boxes.forEach((b, i) => {
      const x = startX + (i % 3) * 150;
      const y = startY + Math.floor(i / 3) * 70;
      drawBox(x, y, b[0], b[1]);
    });

    doc.addPage();

    // =========================
    // 📋 VAC SECTION (UI STYLE)
    // =========================
    doc
      .fontSize(18)
      .fillColor("#2c3e50")
      .text("VAC Forms", { underline: true });

    doc.moveDown(1);

    vacData.forEach((item, i) => {
      doc.fontSize(13).fillColor("#2c3e50").text(`VAC Forms #${i + 1}`);
      doc.moveDown(0.5);

      doc.fontSize(10).fillColor("black");

      doc.text("VAC");
      doc.text(`Program Id: ${item.program_Id || "-"}`);

      // COURSES
      if (item.courses && item.courses.length > 0) {
        item.courses.forEach((course, index) => {
          doc.moveDown(0.5);

          doc.text(`Course ${index + 1}`);
          doc.text(`Course Name: ${course.courseName || "-"}`);
          doc.text(`Course Code: ${course.courseCode || "-"}`);
          doc.text(`Duration (Hours): ${course.duration || "-"}`);
          doc.text(`Times Offered: ${course.timesOffered || "-"}`);
          doc.text(`Students Enrolled: ${course.studentsEnrolled || "-"}`);
          doc.text(`Students Completed: ${course.studentsCompleted || "-"}`);
        });
      }

      doc.moveDown(0.5);

      doc.text(`Brochure/Link: ${item.uploadedFile || "------"}`);
      doc.text(`Coordinator: ${item.coordinatorName || "-"}`);
      doc.text(
        `Created At: ${
          item.createdAt
            ? new Date(item.createdAt).toLocaleString()
            : "-"
        }`
      );

      doc.moveDown(1);

      // =========================
      // 🖼️ VAC IMAGE (COMMENTED)
      // =========================
      
      if (item.uploadedFile) {
        const imagePath = path.join(
          process.cwd(),
          "uploads",
          "vac-broucher",
          item.uploadedFile
        );

        if (fs.existsSync(imagePath)) {
          doc.image(imagePath, { fit: [200, 150] });
        }
      }
      

      doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke("#ccc");
      doc.moveDown(1);

      if (doc.y > 700) doc.addPage();
    });

    // =========================
    // 📋 PC SECTION
    // =========================
    doc.addPage();

    doc
      .fontSize(18)
      .fillColor("#2c3e50")
      .text("PC Forms", { underline: true });

    doc.moveDown(1);

    pcData.forEach((item, i) => {
      doc.fontSize(13).fillColor("#2c3e50").text(`PC Forms #${i + 1}`);
      doc.moveDown(0.5);

      doc.fontSize(10).fillColor("black");

      doc.text("PC");
      doc.text(`Academic Year: ${item.academicYear || "-"}`);
      doc.text(`Coordinator Contact: ${item.coordinatorContact || "-"}`);
      doc.text(`Coordinator Email: ${item.coordinatorEmail || "-"}`);
      doc.text(`Coordinator Name: ${item.coordinatorName || "-"}`);
      doc.text(`Created At: ${item.createdAt || "-"}`);
      doc.text(`Created By: ${item.createdBy || "-"}`);
      doc.text(`Department: ${item.department || "-"}`);
      doc.text(`Program Id: ${item.program_Id || "------"}`);
      doc.text(`Programme Code: ${item.programmeCode || "-"}`);
      doc.text(`Programme Name: ${item.programmeName || "-"}`);
      doc.text(`School Name: ${item.schoolName || "-"}`);
      doc.text(`Semester: ${item.semester || "-"}`);
      doc.text(`Updated At: ${item.updatedAt || "-"}`);
      doc.text(`Uploaded File: ${item.uploadedFile || "------"}`);
      doc.text(`Year Of Introduction: ${item.yearOfIntroduction || "-"}`);

      doc.moveDown(1);

      // =========================
      // 🖼️ PC IMAGE (COMMENTED)
      // =========================
      /*
      if (item.uploadedFile) {
        const imagePath = path.join(
          process.cwd(),
          "uploads",
          "pc-file",
          item.uploadedFile
        );

        if (fs.existsSync(imagePath)) {
          doc.image(imagePath, { fit: [200, 150] });
        }
      }
      */

      doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke("#ccc");
      doc.moveDown(1);

      if (doc.y > 700) doc.addPage();
    });

    // =========================
    // 📄 FOOTER
    // =========================
    doc.moveDown(2);
    doc
      .fontSize(9)
      .fillColor("gray")
      .text("Generated by ERP System", { align: "center" });

    doc.end();
  } catch (err) {
    console.error(err);

    if (res && !res.headersSent) {
      res.status(500).send("PDF generation failed");
    }
  }
};

export const downloadPDF = async (req, res) => {
  try {
    const { formType, department, programId, academicYear, semester } = req.query;
    const selectedFormType = String(formType || "").trim().toLowerCase();
    const matchesFormType = (label) =>
      !selectedFormType || selectedFormType === label.toLowerCase();

    const vacFilter = buildFilter({
      programId,
      includeSemester: false,
      includeDepartment: false
    });
    const pcFilter = buildFilter({
      programId,
      semester,
      department,
      academicYear,
      includeAcademicYear: true
    });
    const otherFilter = buildFilter({ programId, semester, department });

  
    const [
      vacData,
      pcData,
      libraryCount,
      econtentCount,
      capacityCount,
      teachingCount,
      experientialCount,
      learnerSupportCount,
      pcCount,
    ] = await Promise.all([
      matchesFormType("VAC")
        ? VacEntry.find(vacFilter).populate("courses").lean()
        : [],
      matchesFormType("PC")
        ? PcDetails.find(pcFilter).lean()
        : [],
      
      matchesFormType("Library") ? Library.countDocuments(otherFilter) : 0,
      matchesFormType("E-Content") ? EContent.countDocuments(otherFilter) : 0,
      matchesFormType("Capacity") ? Capacity.countDocuments(otherFilter) : 0,
      matchesFormType("Teaching & Learning") ? Teaching.countDocuments(otherFilter) : 0,
      matchesFormType("Experiential") ? Experiential.countDocuments(otherFilter) : 0,
      matchesFormType("Learner Support") ? LearnerSupport.countDocuments(otherFilter) : 0,
      matchesFormType("PC") ? PcDetails.countDocuments(pcFilter) : 0,
    ]);

    const summary = {
      vac: vacData.length,
      library: libraryCount,
      econtent: econtentCount,
      capacity: capacityCount,
      teaching: teachingCount,
      experiential: experientialCount,
      learnerSupport: learnerSupportCount,
      pc: pcCount,
      total:
        vacData.length +
        libraryCount +
        econtentCount +
        capacityCount +
        teachingCount +
        experientialCount +
        learnerSupportCount +
        pcCount,
    };

    await generateEnhancedPDF(res, { summary, vacData ,pcData});
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating PDF");
  }
};


// export const downloadPDF = async (req, res) => {
//   try {
//     const { data, filters } = req.body;

//     if (!data || Object.keys(data).length === 0) {
//       return res.status(400).json({ error: "No data to generate PDF" });
//     }

//     const doc = new PDFDocument({ margin: 30 });
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", "attachment; filename=consolidated-report.pdf");

//     doc.pipe(res);

//     // ====================
//     // TITLE
//     // ====================
//     doc.fontSize(18).text("Consolidated ERP Report", { align: "center" });
//     doc.moveDown();

//     // ====================
//     // FILTERS
//     // ====================
//     if (filters && Object.keys(filters).length) {
//       doc.fontSize(12).text("Applied Filters:", { underline: true });
//       Object.entries(filters).forEach(([key, value]) => {
//         if (value) doc.text(`${key}: ${value}`);
//       });
//       doc.moveDown();
//     }

//     // ====================
//     // DYNAMIC FORM LOOP
//     // ====================
//     for (const formType in data) {
//       const forms = data[formType];
//       if (!forms || forms.length === 0) continue;

//       forms.forEach((form, i) => {
//         doc.addPage();
//         doc.fontSize(14).text(`${formType} Forms #${i + 1}`);
//         doc.moveDown(0.5);

//         // First row: FormType
//         doc.fontSize(12).text(formType);
//         doc.moveDown(0.2);

//         // Generic field rendering
//         for (const [key, value] of Object.entries(form)) {
//           if (["_id", "__v"].includes(key)) continue;

//           // Special handling for VAC courses
//           if (
//             formType.toUpperCase() === "VAC" &&
//             key === "courses" &&
//             Array.isArray(value)
//           ) {
//             if (form.program_Id) {
//               doc.text("Program Id");
//               doc.text(form.program_Id);
//               doc.moveDown(0.2);
//             }

//             value.forEach((course, idx) => {
//               doc.text(`Course ${idx + 1}`);
//               Object.entries(course).forEach(([k, v]) => {
//                 const textValue = v ?? "------";
//                 const label = k
//                   .replace(/([A-Z])/g, " $1")
//                   .replace(/_/g, " ")
//                   .replace(/^./, (s) => s.toUpperCase());
//                 doc.text(label);
//                 doc.text(textValue);
//               });
//               doc.moveDown(0.2);
//             });

//             // VAC uploaded file as image
//             if (form.uploadedFile) {
//               const imagePath = path.join(
//                 process.cwd(),
//                 "uploads",
//                 "vac-broucher",
//                 form.uploadedFile
//               );
//               if (fs.existsSync(imagePath)) {
//                 try {
//                   doc.image(imagePath, { fit: [250, 150] });
//                   doc.moveDown();
//                 } catch (e) {
//                   console.warn("Failed to insert VAC image:", e);
//                 }
//               }
//             }

//             // Other fields like Coordinator, CreatedAt
//             if (form.coordinator) {
//               doc.text("Coordinator");
//               doc.text(form.coordinator);
//             }
//             if (form.createdAt) {
//               doc.text("Created At");
//               doc.text(new Date(form.createdAt).toLocaleString());
//             }

//             doc.moveDown(0.5);
//             continue;
//           }

//           // Generic array fields (non-VAC)
//           if (Array.isArray(value)) {
//             doc.text(`${key}:`);
//             value.forEach((item, idx) => {
//               doc.text(`  Item ${idx + 1}:`);
//               Object.entries(item).forEach(([k, v]) => {
//                 doc.text(`    ${k}: ${v ?? "-"}`);
//               });
//             });
//           }
//           // Generic object fields
//           else if (typeof value === "object" && value !== null) {
//             doc.text(`${key}: ${JSON.stringify(value)}`);
//           }
//           // Primitive fields
//           else {
//             doc.text(key);
//             doc.text(value ?? "------");
//           }
//         }

//         // ====================
//         // PC or other forms images (commented)
//         // ====================
//         /*
//         if (form.uploadedFile) {
//           const imagePath = path.join(process.cwd(), "uploads", "other-form-folder", form.uploadedFile);
//           if (fs.existsSync(imagePath)) {
//             try {
//               doc.image(imagePath, { fit: [250, 150] });
//               doc.moveDown();
//             } catch (e) {
//               console.warn("Failed to insert image:", e);
//             }
//           }
//         }
//         */

//         doc.moveDown(0.5);
//         doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke("#ccc");
//         doc.moveDown(0.5);

//         if (doc.y > 700) doc.addPage();
//       });
//     }

//     doc.end();
//   } catch (err) {
//     console.error("PDF generation error:", err);
//     res.status(500).json({ error: "Failed to generate PDF" });
//   }
// };
export const getConsolidatedData = async (req, res) => {
  try {
    if (!mongoose || !mongoose.connection || mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "DB not connected" });
    }

    const consolidatedData = {
      vac: [],
      library: [],
      econtent: [],
      capacity: [],
      teaching: [],
      experiential: [],
      learnerSupport: [],
      pc: [],
      summary: {}
    };

    // Fetch all form types
    const [vacData, libraryData, econtentData, capacityData, teachingData, experientialData, learnerSupportData, pcData] = await Promise.all([
      VacEntry.find({}).lean().exec(),
      Library.find({}).lean().exec(),
      EContent.find({}).lean().exec(),
      Capacity.find({}).lean().exec(),
      Teaching.find({}).lean().exec(),
      Experiential.find({}).lean().exec(),
      LearnerSupport.find({}).lean().exec(),
      PcDetails.find({}).lean().exec()
    ]);

    // Format and add form type to each entry
    consolidatedData.vac = vacData.map((d) => ({
      formType: "VAC",
      ...d,
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
    }));

    consolidatedData.library = libraryData.map((d) => ({
      formType: "Library",
      ...d,
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
    }));

    consolidatedData.econtent = econtentData.map((d) => ({
      formType: "E-Content",
      ...d,
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
    }));

    consolidatedData.capacity = capacityData.map((d) => ({
      formType: "Capacity",
      ...d,
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
    }));

    consolidatedData.teaching = teachingData.map((d) => ({
      formType: "Teaching & Learning",
      ...d,
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
    }));

    consolidatedData.experiential = experientialData.map((d) => ({
      formType: "Experiential",
      ...d,
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
    }));

    consolidatedData.learnerSupport = learnerSupportData.map((d) => ({
      formType: "Learner Support",
      ...d,
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
    }));

    consolidatedData.pc = pcData.map((d) => ({
      formType: "PC",
      ...d,
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
    }));

    // Generate summary
    consolidatedData.summary = {
      totalVAC: vacData.length,
      totalLibrary: libraryData.length,
      totalEContent: econtentData.length,
      totalCapacity: capacityData.length,
      totalTeaching: teachingData.length,
      totalExperiential: experientialData.length,
      totalLearnerSupport: learnerSupportData.length,
      totalPC: pcData.length,
      grandTotal: 
        vacData.length + 
        libraryData.length + 
        econtentData.length + 
        capacityData.length + 
        teachingData.length + 
        experientialData.length + 
        learnerSupportData.length + 
        pcData.length
    };

    res.json(consolidatedData);
  } catch (err) {
    console.error("Error fetching consolidated data", err);
    res.status(500).json({ error: "Failed to fetch consolidated data" });
  }
};

// Get consolidated data as CSV format
// export const downloadConsolidatedCSV = async (req, res) => {
//   try {
//     if (!mongoose || !mongoose.connection || mongoose.connection.readyState !== 1) {
//       return res.status(503).json({ error: "DB not connected" });
//     }

//     const [vacData, libraryData, econtentData, capacityData, teachingData, experientialData, learnerSupportData, pcData] = await Promise.all([
//       VacEntry.find({}).lean().exec(),
//       Library.find({}).lean().exec(),
//       EContent.find({}).lean().exec(),
//       Capacity.find({}).lean().exec(),
//       Teaching.find({}).lean().exec(),
//       Experiential.find({}).lean().exec(),
//       LearnerSupport.find({}).lean().exec(),
//       PcDetails.find({}).lean().exec()
//     ]);

//     // Combine all data
//     const allData = [
//       ...vacData.map((d) => ({
//         formType: "VAC",
//         ...d,
//         createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
//       })),
//       ...libraryData.map((d) => ({
//         formType: "Library",
//         ...d,
//         createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
//       })),
//       ...econtentData.map((d) => ({
//         formType: "E-Content",
//         ...d,
//         createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
//       })),
//       ...capacityData.map((d) => ({
//         formType: "Capacity",
//         ...d,
//         createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
//       })),
//       ...teachingData.map((d) => ({
//         formType: "Teaching & Learning",
//         ...d,
//         createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
//       })),
//       ...experientialData.map((d) => ({
//         formType: "Experiential",
//         ...d,
//         createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
//       })),
//       ...learnerSupportData.map((d) => ({
//         formType: "Learner Support",
//         ...d,
//         createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
//       })),
//       ...pcData.map((d) => ({
//         formType: "PC",
//         ...d,
//         createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
//       }))
//     ];

//     if (allData.length === 0) {
//       return res.status(404).json({ error: "No data to download" });
//     }

//     const csv = generateCSV(allData);
//     res.setHeader("Content-Type", "text/csv");
//     res.setHeader("Content-Disposition", "attachment; filename=consolidated-forms-report.csv");
//     res.send(csv);
//   } catch (err) {
//     console.error("Error downloading consolidated CSV", err);
//     res.status(500).json({ error: "Failed to download CSV" });
//   }
// };
// import ExcelJS from "exceljs";

// export const downloadConsolidatedExcel = async (req, res) => {
//   try {
//     const [
//       vacData,
//       pcData,
//       libraryData,
//       econtentData,
//       capacityData,
//       teachingData,
//       experientialData,
//       learnerSupportData
//     ] = await Promise.all([
//       VacEntry.find({}).populate("courses").lean(),
//       PcDetails.find({}).lean(),
//       Library.find({}).lean(),
//       EContent.find({}).lean(),
//       Capacity.find({}).lean(),
//       Teaching.find({}).lean(),
//       Experiential.find({}).lean(),
//       LearnerSupport.find({}).lean()
//     ]);

//     const workbook = new ExcelJs.Workbook();

//     // =========================
//     // ✅ VAC SHEET (ANNEXURE FORMAT)
//     // =========================
//     const vacSheet = workbook.addWorksheet("VAC");

//     vacSheet.addRow(["Annexure - VAC Report"]);
//     vacSheet.mergeCells("A1:I1");

//     const vacHeaders = [
//       "Program ID",
//       "Course Name",
//       "Course Code",
//       "Duration",
//       "Times Offered",
//       "Students Enrolled",
//       "Students Completed",
//       "Coordinator",
//       "Created At",
//     ];

//     vacSheet.addRow([]);
//     vacSheet.addRow(vacHeaders);

//     vacData.forEach((vac) => {
//       if (vac.courses?.length) {
//         vac.courses.forEach((course) => {
//           vacSheet.addRow([
//             vac.program_Id,
//             course.courseName,
//             course.courseCode,
//             course.duration,
//             course.timesOffered,
//             course.studentsEnrolled,
//             course.studentsCompleted,
//             vac.coordinatorName,
//             new Date(vac.createdAt).toLocaleString(),
//           ]);
//         });
//       }
//     });

//     // =========================
//     // ✅ PC SHEET
//     // =========================
//     const pcSheet = workbook.addWorksheet("PC");

//     pcSheet.addRow(["Annexure - PC Report"]);
//     pcSheet.mergeCells("A1:F1");

//     const pcHeaders = [
//       "Program ID",
//       "Coordinator",
//       "Academic Year",
//       "Semester",
//       "Department",
//       "Created At",
//     ];

//     pcSheet.addRow([]);
//     pcSheet.addRow(pcHeaders);

//     pcData.forEach((pc) => {
//       pcSheet.addRow([
//         pc.program_Id,
//         pc.coordinatorName,
//         pc.academicYear,
//         pc.semester,
//         pc.department,
//         new Date(pc.createdAt).toLocaleString(),
//       ]);
//     });

//     // =========================
//     // ✅ GENERIC SHEET CREATOR
//     // =========================
//     const createSheet = (name, data) => {
//       const sheet = workbook.addWorksheet(name);

//       sheet.addRow([`Annexure - ${name} Report`]);
//       sheet.mergeCells("A1:H1");

//       if (!data.length) return;

//       const headers = Object.keys(data[0]);
//       sheet.addRow([]);
//       sheet.addRow(headers);

//       data.forEach((item) => {
//         sheet.addRow(headers.map((h) => item[h]));
//       });
//     };

//     createSheet("Library", libraryData);
//     createSheet("E-Content", econtentData);
//     createSheet("Capacity", capacityData);
//     createSheet("Teaching", teachingData);
//     createSheet("Experiential", experientialData);
//     createSheet("LearnerSupport", learnerSupportData);

//     // =========================
//     // 🎯 RESPONSE
//     // =========================
//     res.setHeader(
//       "Content-Type",
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//     );

//     res.setHeader(
//       "Content-Disposition",
//       "attachment; filename=Annexure_Report.xlsx"
//     );

//     await workbook.xlsx.write(res);
//     res.end();

//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Excel generation failed");
//   }
// };  

// controllers/consolidatedReportController.js
export const downloadConsolidatedExcel = async (req, res) => {
  try {
    const { formType, semester, department, programId } = req.query;
    const selectedFormType = String(formType || "").trim().toLowerCase();
    const matchesFormType = (label) =>
      !selectedFormType || selectedFormType === label.toLowerCase();

    // Per-model filters so VAC is not wrongly filtered by semester/department.
    const vacFilter = buildFilter({
      programId,
      includeSemester: false,
      includeDepartment: false
    });
    const pcFilter = buildFilter({ programId, semester, department });
    const genericFilter = buildFilter({ programId, semester, department });

    // =========================
    // FETCH DATA WITH FILTERS
    // =========================
    const [
      vacData,
      pcData,
      libraryData,
      econtentData,
      capacityData,
      teachingData,
      experientialData,
      learnerSupportData
    ] = await Promise.all([
      matchesFormType("VAC")
        ? VacEntry.find(vacFilter).populate("courses").lean()
        : [],
      matchesFormType("PC")
        ? PcDetails.find(pcFilter).lean()
        : [],
      matchesFormType("Library")
        ? Library.find(genericFilter).lean()
        : [],
      matchesFormType("E-Content")
        ? EContent.find(genericFilter).lean()
        : [],
      matchesFormType("Capacity")
        ? Capacity.find(genericFilter).lean()
        : [],
      matchesFormType("Teaching & Learning")
        ? Teaching.find(genericFilter).lean()
        : [],
      matchesFormType("Experiential")
        ? Experiential.find(genericFilter).lean()
        : [],
      matchesFormType("Learner Support")
        ? LearnerSupport.find(genericFilter).lean()
        : []
    ]);

    const workbook = new ExcelJs.Workbook();

    // =========================
    // ✅ VAC SHEET WITH DOWNLOAD LINK
    // =========================
    if (vacData.length) {
      const vacSheet = workbook.addWorksheet("VAC");

      vacSheet.addRow(["Annexure - VAC Report"]);
      vacSheet.mergeCells("A1:J1");

      const headers = [
        "Program ID",
        "Course Name",
        "Course Code",
        "Duration",
        "Times Offered",
        "Students Enrolled",
        "Students Completed",
        "Coordinator",
        "Created At",
        "Brochure Download"
      ];

      vacSheet.addRow([]);
      vacSheet.addRow(headers);

      vacData.forEach((vac) => {
        const fileLink = vac.uploadedFile
          ? (() => {
              const safeFileName = String(vac.uploadedFile);
              const token = createCertificateDownloadToken("vac", safeFileName);
              return `${req.protocol}://${req.get("host")}/api/consolidated-report/certificate/vac/${encodeURIComponent(safeFileName)}?token=${encodeURIComponent(token)}`;
            })()
          : "N/A";

        // Ensure every VAC entry appears at least once, even if courses is empty.
        const courses = Array.isArray(vac.courses) && vac.courses.length
          ? vac.courses
          : [{}];

        courses.forEach((course) => {
          const row = vacSheet.addRow([
            vac.program_Id,
            course.courseName || "",
            course.courseCode || "",
            course.duration || "",
            course.timesOffered || "",
            course.studentsEnrolled || "",
            course.studentsCompleted || "",
            vac.coordinatorName,
            new Date(vac.createdAt).toLocaleString(),
            fileLink
          ]);

          // Make link clickable
          if (vac.uploadedFile) {
            row.getCell(10).value = {
              text: "Download",
              hyperlink: fileLink
            };
          }
        });
      });
    }

    // =========================
    // ✅ PC SHEET
    // =========================
    if (pcData.length) {
      const pcSheet = workbook.addWorksheet("PC");

      pcSheet.addRow(["Annexure - PC Report"]);
      pcSheet.mergeCells("A1:G1");

      pcSheet.addRow([]);
      pcSheet.addRow([
        "Program ID",
        "Coordinator",
        "Academic Year",
        "Semester",
        "Department",
        "Created At",
        "Certificate Download"
      ]);

      pcData.forEach((pc) => {
        const fileLink = pc.uploadedFile
          ? (() => {
              const safeFileName = String(pc.uploadedFile);
              const token = createCertificateDownloadToken("pc", safeFileName);
              return `${req.protocol}://${req.get("host")}/api/consolidated-report/certificate/pc/${encodeURIComponent(safeFileName)}?token=${encodeURIComponent(token)}`;
            })()
          : "N/A";

        const row = pcSheet.addRow([
          pc.program_Id,
          pc.coordinatorName,
          pc.academicYear,
          pc.semester,
          pc.department,
          new Date(pc.createdAt).toLocaleString(),
          fileLink
        ]);

        if (pc.uploadedFile) {
          row.getCell(7).value = {
            text: "Download",
            hyperlink: fileLink
          };
        }
      });
    }

    // =========================
    // ✅ GENERIC SHEETS
    // =========================
    const createSheet = (name, data) => {
      if (!data.length) return;

      const sheet = workbook.addWorksheet(name);

      sheet.addRow([`Annexure - ${name} Report`]);
      sheet.mergeCells("A1:H1");

      const headers = Object.keys(data[0]).filter(
        (k) => !["_id", "__v"].includes(k)
      );

      sheet.addRow([]);
      sheet.addRow(headers);

      data.forEach((item) => {
        sheet.addRow(headers.map((h) => item[h]));
      });
    };

    createSheet("Library", libraryData);
    createSheet("E-Content", econtentData);
    createSheet("Capacity", capacityData);
    createSheet("Teaching", teachingData);
    createSheet("Experiential", experientialData);
    createSheet("LearnerSupport", learnerSupportData);

    // =========================
    // 🎯 RESPONSE
    // =========================
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Annexure_Report.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error(err);
    res.status(500).send("Excel generation failed");
  }
};

export const downloadCertificateFile = async (req, res) => {
  try {
    const formType = String(req.params.formType || "").toLowerCase();
    const rawFileName = decodeURIComponent(req.params.fileName || "");
    const safeFileName = path.basename(rawFileName);
    const token = String(req.query.token || "");

    if (!safeFileName) {
      return res.status(400).json({ success: false, message: "Missing file name" });
    }

    if (safeFileName !== rawFileName) {
      return res.status(400).json({ success: false, message: "Invalid file name" });
    }

    const candidateDirs = CERTIFICATE_DIRS[formType];
    if (!candidateDirs) {
      return res.status(400).json({ success: false, message: "Invalid form type" });
    }

    // Allow either logged-in request (browser app) OR valid signed link (Excel/opened externally).
    const isAuthorizedUser = Boolean(req.user);
    const isValidSignedLink = token
      ? verifyCertificateDownloadToken(token, formType, safeFileName)
      : false;

    if (!isAuthorizedUser && !isValidSignedLink) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Please login first."
      });
    }

    let filePath = null;
    for (const dir of candidateDirs) {
      const candidatePath = path.join(dir, safeFileName);
      if (candidatePath.startsWith(dir) && fs.existsSync(candidatePath)) {
        filePath = candidatePath;
        break;
      }
    }

    if (!filePath) {
      return res.status(404).json({ success: false, message: "Certificate file not found" });
    }

    return res.download(filePath, safeFileName);
  } catch (err) {
    console.error("Certificate download error:", err);
    return res.status(500).json({ success: false, message: "Failed to download certificate" });
  }
};



// Helper function to generate CSV
function generateCSV(data) {
  if (!Array.isArray(data) || data.length === 0) return "";

  // Get all unique keys from all objects
  const keys = Array.from(
    data.reduce((acc, row) => {
      Object.keys(row).forEach((k) => acc.add(k));
      return acc;
    }, new Set())
  );

  // Sort keys to keep formType first
  const sortedKeys = ["formType", ...keys.filter(k => k !== "formType")];

  const escape = escapeCsvValue;

  const header = sortedKeys.join(",");

  const lines = data.map((row) => 
    sortedKeys.map((key) => escape(row[key])).join(",")
  );

  return [header, ...lines].join("\n");
}

function escapeCsvValue(value) {
  if (value === null || value === undefined) return "";
  
  let stringValue = typeof value === "object" ? JSON.stringify(value) : String(value);
  
  // If value contains comma, quote, or newline, wrap in quotes
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    // Escape quotes by doubling them
    stringValue = stringValue.replace(/"/g, '""');
    return `"${stringValue}"`;
  }
  
  return stringValue;
}

// Get summary statistics
export const getSummary = async (req, res) => {
  try {
    if (!mongoose || !mongoose.connection || mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "DB not connected" });
    }

    const [vacCount, libraryCount, econtentCount, capacityCount, teachingCount, experientialCount, learnerSupportCount, pcCount] = await Promise.all([
      VacEntry.countDocuments({}),
      Library.countDocuments({}),
      EContent.countDocuments({}),
      Capacity.countDocuments({}),
      Teaching.countDocuments({}),
      Experiential.countDocuments({}),
      LearnerSupport.countDocuments({}),
      PcDetails.countDocuments({})
    ]);

    const summary = {
      vac: vacCount,
      library: libraryCount,
      econtent: econtentCount,
      capacity: capacityCount,
      teaching: teachingCount,
      experiential: experientialCount,
      learnerSupport: learnerSupportCount,
      pc: pcCount,
      total: vacCount + libraryCount + econtentCount + capacityCount + teachingCount + experientialCount + learnerSupportCount + pcCount
    };

    res.json(summary);
  } catch (err) {
    console.error("Error fetching summary", err);
    res.status(500).json({ error: "Failed to fetch summary" });
  }
};
