import mongoose from "mongoose";
import VacEntry from "../models/vac-model.js";
import Library from "../models/library-model.js";
import EContent from "../models/econtent-model.js";
import Capacity from "../models/capacity-model.js";
import Teaching from "../models/teaching-model.js";
import Experiential from "../models/experiential-model.js";
import LearnerSupport from "../models/learnerSupport-model.js";
import PcDetails from "../models/pc_model.js";

// Consolidate all form data into a unified format
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
