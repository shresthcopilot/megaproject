// export function makeDownloadLink(req, formType, fileName, createDownloadToken) {
//   if (!fileName) return "N/A";

//   const safeFileName = String(fileName).trim();
//   const token = createDownloadToken(formType, safeFileName);

//   return `${req.protocol}://${req.get("host")}` +
//     `/api/consolidated-report/certificate/${formType}/` +
//     `${encodeURIComponent(safeFileName)}?token=${encodeURIComponent(token)}`;
// }

// export function setHyperlinkCell(row, cellNumber, url) {
//   if (!url || url === "N/A") return;

//   row.getCell(cellNumber).value = {
//     text: "Download",
//     hyperlink: url,
//   };
// }
export function makeDownloadLink(req, formType, fileName, createDownloadToken) {
  if (!fileName) return "N/A";

  const allowedTypes = ["pc", "vac", "econtent", "library"];

  if (!allowedTypes.includes(formType)) {
    throw new Error("Invalid form type");
  }

  const safeFileName = String(fileName).trim();
  const token = createDownloadToken(formType, safeFileName);

  const BASE_URL = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

  return `${BASE_URL}/api/consolidated-report/certificate/${formType}/${encodeURIComponent(
    safeFileName
  )}?token=${encodeURIComponent(token)}`;
}

export function setHyperlinkCell(row, cellNumber, url) {
  if (!url || url === "N/A") return;

  const cell = row.getCell(cellNumber);

  cell.value = {
    text: "Download",
    hyperlink: url,
  };

  cell.font = {
    color: { argb: "0000FF" },
    underline: true,
  };
}