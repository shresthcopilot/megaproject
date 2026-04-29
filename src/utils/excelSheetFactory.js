export const createEmptySheet = (workbook, name, message = "No data found") => {
  const sheet = workbook.addWorksheet(name);
  sheet.addRow([message]);
  return sheet;
};

export const createTitle = (sheet, title, mergeRange) => {
  sheet.addRow([title]);
  sheet.mergeCells(mergeRange);

  const cell = sheet.getCell("A1");
  cell.font = { bold: true, size: 16 };
  cell.alignment = { horizontal: "center", vertical: "middle" };

  sheet.addRow([]);
};

export const addDownloadCell = (row, col, label, link) => {
  if (!link) return;

  row.getCell(col).value = {
    text: label || "Download",
    hyperlink: link,
  };

  row.getCell(col).font = {
    color: { argb: "0000FF" },
    underline: true,
  };
};