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

// ✅ NEW FUNCTION for pdf generation - combines all form data into a single PDF report


// export const generateEnhancedPDF = async (res, data) => {
//   try {
//     const { summary = {}, vacData = [], pcData = [] } = data || {};

//     const doc = new PDFDocument({ margin: 40 });

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", "attachment; filename=report.pdf");

//     doc.pipe(res);

//     // =========================
//     // 🎯 HEADER
//     // =========================
//     doc
//       .fontSize(22)
//       .fillColor("#2c3e50")
//       .text("ERP Consolidated Report", { align: "center" });

//     doc.moveDown(0.5);

//     doc
//       .fontSize(10)
//       .fillColor("gray")
//       .text(`Generated on: ${new Date().toLocaleString()}`, {
//         align: "center",
//       });

//     doc.moveDown(1.5);

//     // =========================
//     // 📊 SUMMARY GRID
//     // =========================
//     const drawBox = (x, y, label, value) => {
//       doc.rect(x, y, 130, 55).fillAndStroke("#f4f6f7", "#d5d8dc");

//       doc.fillColor("#2c3e50").fontSize(11).text(label, x + 10, y + 10);

//       doc.fillColor("#2980b9").fontSize(18).text(value || 0, x + 10, y + 28);
//     };

//     let startX = 40;
//     let startY = doc.y;

//     const boxes = [
//       ["VAC", summary.vac],
//       ["Library", summary.library],
//       ["E-Content", summary.econtent],
//       ["Capacity", summary.capacity],
//       ["Teaching", summary.teaching],
//       ["Experiential", summary.experiential],
//       ["Support", summary.learnerSupport],
//       ["PC", summary.pc],
//       ["TOTAL", summary.total],
//     ];

//     boxes.forEach((b, i) => {
//       const x = startX + (i % 3) * 150;
//       const y = startY + Math.floor(i / 3) * 70;
//       drawBox(x, y, b[0], b[1]);
//     });

//     doc.addPage();

//     // =========================
//     // 📋 VAC SECTION (UI STYLE)
//     // =========================
//     doc
//       .fontSize(18)
//       .fillColor("#2c3e50")
//       .text("VAC Forms", { underline: true });

//     doc.moveDown(1);

//     vacData.forEach((item, i) => {
//       doc.fontSize(13).fillColor("#2c3e50").text(`VAC Forms #${i + 1}`);
//       doc.moveDown(0.5);

//       doc.fontSize(10).fillColor("black");

//       doc.text("VAC");
//       doc.text(`Program Id: ${item.program_Id || "-"}`);

//       // COURSES
//       if (item.courses && item.courses.length > 0) {
//         item.courses.forEach((course, index) => {
//           doc.moveDown(0.5);

//           doc.text(`Course ${index + 1}`);
//           doc.text(`Course Name: ${course.courseName || "-"}`);
//           doc.text(`Course Code: ${course.courseCode || "-"}`);
//           doc.text(`Duration (Hours): ${course.duration || "-"}`);
//           doc.text(`Times Offered: ${course.timesOffered || "-"}`);
//           doc.text(`Students Enrolled: ${course.studentsEnrolled || "-"}`);
//           doc.text(`Students Completed: ${course.studentsCompleted || "-"}`);
//         });
//       }

//       doc.moveDown(0.5);

//       doc.text(`Brochure/Link: ${item.uploadedFile || "------"}`);
//       doc.text(`Coordinator: ${item.coordinatorName || "-"}`);
//       doc.text(
//         `Created At: ${
//           item.createdAt
//             ? new Date(item.createdAt).toLocaleString()
//             : "-"
//         }`
//       );

//       doc.moveDown(1);

//       // =========================
//       // 🖼️ VAC IMAGE (COMMENTED)
//       // =========================
      
//       if (item.uploadedFile) {
//         const imagePath = path.join(
//           process.cwd(),
//           "uploads",
//           "vac-broucher",
//           item.uploadedFile
//         );

//         if (fs.existsSync(imagePath)) {
//           doc.image(imagePath, { fit: [200, 150] });
//         }
//       }
      

//       doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke("#ccc");
//       doc.moveDown(1);

//       if (doc.y > 700) doc.addPage();
//     });

//     // =========================
//     // 📋 PC SECTION
//     // =========================
//     doc.addPage();

//     doc
//       .fontSize(18)
//       .fillColor("#2c3e50")
//       .text("PC Forms", { underline: true });

//     doc.moveDown(1);

//     pcData.forEach((item, i) => {
//       doc.fontSize(13).fillColor("#2c3e50").text(`PC Forms #${i + 1}`);
//       doc.moveDown(0.5);

//       doc.fontSize(10).fillColor("black");

//       doc.text("PC");
//       doc.text(`Academic Year: ${item.academicYear || "-"}`);
//       doc.text(`Coordinator Contact: ${item.coordinatorContact || "-"}`);
//       doc.text(`Coordinator Email: ${item.coordinatorEmail || "-"}`);
//       doc.text(`Coordinator Name: ${item.coordinatorName || "-"}`);
//       doc.text(`Created At: ${item.createdAt || "-"}`);
//       doc.text(`Created By: ${item.createdBy || "-"}`);
//       doc.text(`Department: ${item.department || "-"}`);
//       doc.text(`Program Id: ${item.program_Id || "------"}`);
//       doc.text(`Programme Code: ${item.programmeCode || "-"}`);
//       doc.text(`Programme Name: ${item.programmeName || "-"}`);
//       doc.text(`School Name: ${item.schoolName || "-"}`);
//       doc.text(`Semester: ${item.semester || "-"}`);
//       doc.text(`Updated At: ${item.updatedAt || "-"}`);
//       doc.text(`Uploaded File: ${item.uploadedFile || "------"}`);
//       doc.text(`Year Of Introduction: ${item.yearOfIntroduction || "-"}`);

//       doc.moveDown(1);

//       // =========================
//       // 🖼️ PC IMAGE (COMMENTED)
//       // =========================
//       /*
//       if (item.uploadedFile) {
//         const imagePath = path.join(
//           process.cwd(),
//           "uploads",
//           "pc-file",
//           item.uploadedFile
//         );

//         if (fs.existsSync(imagePath)) {
//           doc.image(imagePath, { fit: [200, 150] });
//         }
//       }
//       */

//       doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke("#ccc");
//       doc.moveDown(1);

//       if (doc.y > 700) doc.addPage();
//     });

//     // =========================
//     // 📄 FOOTER
//     // =========================
//     doc.moveDown(2);
//     doc
//       .fontSize(9)
//       .fillColor("gray")
//       .text("Generated by ERP System", { align: "center" });

//     doc.end();
//   } catch (err) {
//     console.error(err);

//     if (res && !res.headersSent) {
//       res.status(500).send("PDF generation failed");
//     }
//   }
// };
// export const downloadPDF = async (req, res) => {
//   try {
//     //fix variable names
//     const { department, programId, academicYear, semester } = req.query;
//      // 🔍 BUILD FILTER OBJECTS
//     // =========================
//     const vacFilter = {};
//     const pcFilter = {};

//     if (department) {
//       vacFilter.department = department;
//       pcFilter.department = department;
//     }

//     if (programId) {
//   vacFilter.program_Id = programId;
//   pcFilter.program_Id = programId;
//   }

//     if (academicYear) {
//       pcFilter.academicYear = academicYear;
//     }

//     if (semester) {
//       pcFilter.semester = semester;
//     }

  
//     const [
//       vacData,
//       pcData,
//       libraryCount,
//       econtentCount,
//       capacityCount,
//       teachingCount,
//       experientialCount,
//       learnerSupportCount,
//       pcCount,
//     ] = await Promise.all([
//       VacEntry.find({})
//       .populate("courses")
//       .lean(),
//         PcDetails.find({}).lean(),
    
//       Library.countDocuments(),
//       EContent.countDocuments(),
//       Capacity.countDocuments(),
//       Teaching.countDocuments(),
//       Experiential.countDocuments(),
//       LearnerSupport.countDocuments(),
//       PcDetails.countDocuments(),
//     ]);

//     const summary = {
//       vac: vacData.length,
//       library: libraryCount,
//       econtent: econtentCount,
//       capacity: capacityCount,
//       teaching: teachingCount,
//       experiential: experientialCount,
//       learnerSupport: learnerSupportCount,
//       pc: pcCount,
//       total:
//         vacData.length +
//         libraryCount +
//         econtentCount +
//         capacityCount +
//         teachingCount +
//         experientialCount +
//         learnerSupportCount +
//         pcCount,
//     };

//     await generateEnhancedPDF(res, { summary, vacData ,pcData});
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Error generating PDF");
//   }
// };
// Consolidate all form data into a unified format


export const downloadPDF = async (req, res) => {
  try {
    const { data, filters } = req.body;

    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({ error: "No data to generate PDF" });
    }

    const doc = new PDFDocument({ margin: 30 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=consolidated-report.pdf");

    doc.pipe(res);

    // ====================
    // TITLE
    // ====================
    doc.fontSize(18).text("Consolidated ERP Report", { align: "center" });
    doc.moveDown();

    // ====================
    // FILTERS
    // ====================
    if (filters && Object.keys(filters).length) {
      doc.fontSize(12).text("Applied Filters:", { underline: true });
      Object.entries(filters).forEach(([key, value]) => {
        if (value) doc.text(`${key}: ${value}`);
      });
      doc.moveDown();
    }

    // ====================
    // DYNAMIC FORM LOOP
    // ====================
    for (const formType in data) {
      const forms = data[formType];
      if (!forms || forms.length === 0) continue;

      forms.forEach((form, i) => {
        doc.addPage();
        doc.fontSize(14).text(`${formType} Forms #${i + 1}`);
        doc.moveDown(0.5);

        // First row: FormType
        doc.fontSize(12).text(formType);
        doc.moveDown(0.2);

        // Generic field rendering
        for (const [key, value] of Object.entries(form)) {
          if (["_id", "__v"].includes(key)) continue;

          // Special handling for VAC courses
          if (
            formType.toUpperCase() === "VAC" &&
            key === "courses" &&
            Array.isArray(value)
          ) {
            if (form.program_Id) {
              doc.text("Program Id");
              doc.text(form.program_Id);
              doc.moveDown(0.2);
            }

            value.forEach((course, idx) => {
              doc.text(`Course ${idx + 1}`);
              Object.entries(course).forEach(([k, v]) => {
                const textValue = v ?? "------";
                const label = k
                  .replace(/([A-Z])/g, " $1")
                  .replace(/_/g, " ")
                  .replace(/^./, (s) => s.toUpperCase());
                doc.text(label);
                doc.text(textValue);
              });
              doc.moveDown(0.2);
            });

            // VAC uploaded file as image
            if (form.uploadedFile) {
              const imagePath = path.join(
                process.cwd(),
                "uploads",
                "vac-broucher",
                form.uploadedFile
              );
              if (fs.existsSync(imagePath)) {
                try {
                  doc.image(imagePath, { fit: [250, 150] });
                  doc.moveDown();
                } catch (e) {
                  console.warn("Failed to insert VAC image:", e);
                }
              }
            }

            // Other fields like Coordinator, CreatedAt
            if (form.coordinator) {
              doc.text("Coordinator");
              doc.text(form.coordinator);
            }
            if (form.createdAt) {
              doc.text("Created At");
              doc.text(new Date(form.createdAt).toLocaleString());
            }

            doc.moveDown(0.5);
            continue;
          }

          // Generic array fields (non-VAC)
          if (Array.isArray(value)) {
            doc.text(`${key}:`);
            value.forEach((item, idx) => {
              doc.text(`  Item ${idx + 1}:`);
              Object.entries(item).forEach(([k, v]) => {
                doc.text(`    ${k}: ${v ?? "-"}`);
              });
            });
          }
          // Generic object fields
          else if (typeof value === "object" && value !== null) {
            doc.text(`${key}: ${JSON.stringify(value)}`);
          }
          // Primitive fields
          else {
            doc.text(key);
            doc.text(value ?? "------");
          }
        }

        // ====================
        // PC or other forms images (commented)
        // ====================
        /*
        if (form.uploadedFile) {
          const imagePath = path.join(process.cwd(), "uploads", "other-form-folder", form.uploadedFile);
          if (fs.existsSync(imagePath)) {
            try {
              doc.image(imagePath, { fit: [250, 150] });
              doc.moveDown();
            } catch (e) {
              console.warn("Failed to insert image:", e);
            }
          }
        }
        */

        doc.moveDown(0.5);
        doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke("#ccc");
        doc.moveDown(0.5);

        if (doc.y > 700) doc.addPage();
      });
    }

    doc.end();
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
};
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
export const downloadConsolidatedCSV = async (req, res) => {
  try {
    if (!mongoose || !mongoose.connection || mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "DB not connected" });
    }

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

    // Combine all data
    const allData = [
      ...vacData.map((d) => ({
        formType: "VAC",
        ...d,
        createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
      })),
      ...libraryData.map((d) => ({
        formType: "Library",
        ...d,
        createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
      })),
      ...econtentData.map((d) => ({
        formType: "E-Content",
        ...d,
        createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
      })),
      ...capacityData.map((d) => ({
        formType: "Capacity",
        ...d,
        createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
      })),
      ...teachingData.map((d) => ({
        formType: "Teaching & Learning",
        ...d,
        createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
      })),
      ...experientialData.map((d) => ({
        formType: "Experiential",
        ...d,
        createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
      })),
      ...learnerSupportData.map((d) => ({
        formType: "Learner Support",
        ...d,
        createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
      })),
      ...pcData.map((d) => ({
        formType: "PC",
        ...d,
        createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
      }))
    ];

    if (allData.length === 0) {
      return res.status(404).json({ error: "No data to download" });
    }

    const csv = generateCSV(allData);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=consolidated-forms-report.csv");
    res.send(csv);
  } catch (err) {
    console.error("Error downloading consolidated CSV", err);
    res.status(500).json({ error: "Failed to download CSV" });
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
