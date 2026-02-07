import fs from "fs";
import path from "path";

// Simple CSV generator
export function generateCSV(data, filename = "report.csv") {
  if (!Array.isArray(data) || !data.length) return;

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","), // header row
    ...data.map(row => headers.map(h => JSON.stringify(row[h] || "")).join(","))
  ].join("\n");

  const filePath = path.join(process.cwd(), "downloads", filename);

  // Ensure folder exists
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  fs.writeFileSync(filePath, csv, "utf8");

  return filePath;
}
