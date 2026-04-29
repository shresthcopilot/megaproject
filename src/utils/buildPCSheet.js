import { createEmptySheet, createTitle, addDownloadCell } from "./excelSheetFactory.js";

export const buildPCSheet = (
  workbook,
  pcData,
  req,
  makeDownloadLink,
  createDownloadToken
) => {
  const sheet = workbook.addWorksheet("PC");

  if (!pcData.length) {
    return createEmptySheet(workbook, "PC");
  }

  // ======================
  // TITLE
  // ======================
  createTitle(sheet, "Annexure - Programme Coordinator Report", "A1:T1");

  // ======================
  // HEADERS
  // ======================
  const headers = [
    "Academic Year",
    "Programme Code",
    "Program ID",
    "Semester",
    "Year Of Introduction",
    "School Name",
    "Coordinator Name",
    "Department",
    "Coordinator Email",
    "Coordinator Contact",
    "Programme Name",
    "CBCS Status",
    "CBCS Year",
    "Revision Status",
    "PC Document",
    "Courses Upload",
    "Minutes Meeting",
    "Summary Revision",
    "New Courses",
    "Employability Upload",
  ];

  const headerRow = sheet.addRow(headers);

  // ======================
  // HEADER STYLE
  // ======================
  headerRow.font = { bold: true };
  headerRow.alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };

  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "D9E1F2" },
    };

    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // ======================
  // ROW DATA
  // ======================
  pcData.forEach((pc) => {
    const row = sheet.addRow([
      pc.academicYear,
      pc.programmeCode,
      pc.program_Id,
      Number(pc.semester),
      pc.yearOfIntroduction,
      pc.schoolName,
      pc.coordinatorName,
      pc.department,
      pc.coordinatorEmail,
      pc.coordinatorContact,
      pc.programmeName,
      pc.cbcsStatus,
      pc.cbcsYear,
      pc.revisionStatus,
      "", "", "", "", "", "",
    ]);

    row.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };

    const files = [
      pc.PCdocument,
      pc.coursesUpload,
      pc.minutesMeeting,
      pc.summaryRevision,
      pc.newCoursesFile,
      pc.employabilityUpload,
    ];

    files.forEach((file, index) => {
      if (!file) return;

      const link = makeDownloadLink(req, "pc", file, createDownloadToken);

      addDownloadCell(row, 15 + index, "Download", link);
    });
  });

  // ======================
  // COLUMN WIDTHS (IMPORTANT)
  // ======================
  sheet.columns = [
    { width: 16 }, // Academic Year
    { width: 18 }, // Programme Code
    { width: 15 }, // Program ID
    { width: 10 }, // Semester
    { width: 18 }, // Year Of Intro
    { width: 22 }, // School Name
    { width: 22 }, // Coordinator Name
    { width: 16 }, // Department
    { width: 28 }, // Email
    { width: 18 }, // Contact
    { width: 22 }, // Programme Name
    { width: 14 }, // CBCS Status
    { width: 14 }, // CBCS Year
    { width: 16 }, // Revision Status
    { width: 18 }, // PC Doc
    { width: 18 }, // Courses
    { width: 18 }, // Minutes
    { width: 18 }, // Summary
    { width: 18 }, // New Courses
    { width: 20 }, // Employability
  ];

  // ======================
  // BORDER FOR ALL CELLS
  // ======================
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  return sheet;
};