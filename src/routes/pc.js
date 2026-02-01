import express from "express";
import mongoose from "mongoose";

import VacEntryModel from "../models/vac-model.js";
import PcDetailsModel from "../models/pc_model.js";
import { authMiddleware } from "../middleware/auth-middleware.js";

const router = express.Router();

// POST /api/pc/submit - Submit PC form + link to coordinator's courses
router.post("/submit", authMiddleware, async (req, res) => {
  try {
    console.log("PC /submit called by user:", req.user && req.user.id);
    console.log("PC /submit body:", JSON.stringify(req.body).slice(0, 2000));
    console.log("PC /submit file:", req.file ? req.file.filename : "no file");
    const formData = req.body;

    // Validate required fields
    const requiredFields = [
      "academicYear",
      "programmeCode",
      "semester",
      "yearOfIntroduction",
      "schoolName",
      "coordinatorName",
      "departmentName",
      "coordinatorEmail",
      "programmeName",
      "coordinatorContact",
    ];

    for (const field of requiredFields) {
      if (!formData[field]?.trim()) {
        return res
          .status(400)
          .json({ error: `Missing: ${field}` });
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.coordinatorEmail)) {
      return res
        .status(400)
        .json({ error: "Invalid email" });
    }

    // **KEY: Fetch coordinator's own course data only**
    const userCourses = await VacEntryModel.find({
      createdBy: req.user.id,
    })
      .select("courses programmeCode createdAt")
      .lean();

    // Check if programmeCode matches any of coordinator's courses
    const hasMatchingCourses = userCourses.some(
      (course) =>
        String((course.programmeCode || "").toUpperCase()) ===
        String((formData.programmeCode || "").toUpperCase())
    );

    if (!hasMatchingCourses && userCourses.length > 0) {
      return res
        .status(400)
        .json({
          error: "Programme code must match your submitted VAC courses",
          availableProgrammes: userCourses.map((c) => c.programmeCode),
        });
    }

    // Save PC entry with strict user isolation and file reference
    const pcEntry = new PcDetailsModel({
      ...formData,
      createdBy: req.user.id,
      uploadedFile: req.file ? req.file.filename : null,
      // Trim all fields
      academicYear: formData.academicYear.trim(),
      programmeCode: formData.programmeCode.trim().toUpperCase(),
      program_Id: (formData.program_Id || formData.programId || "").toString(),
      semester: formData.semester.trim(),
      yearOfIntroduction: formData.yearOfIntroduction.trim(),
      schoolName: formData.schoolName.trim(),
      coordinatorName: formData.coordinatorName.trim(),
      departmentName: formData.departmentName.trim(),
      coordinatorEmail: formData.coordinatorEmail.trim().toLowerCase(),
      programmeName: formData.programmeName.trim(),
      coordinatorContact: formData.coordinatorContact.trim(),
    });

    const savedEntry = await pcEntry.save();

    res
      .status(201)
      .json({
        success: true,
        message: "Programme details submitted with your course data!",
        entryId: savedEntry._id,
        programmeCode: savedEntry.programmeCode,
        linkedCourses: userCourses.length,
        uploadedFile: savedEntry.uploadedFile,
        redirect: "/pcdashboard.html",
      });
  } catch (error) {
    console.error("PC Submit error:", error);
    res
      .status(500)
      .json({ error: "Server error" });
  }
});

// GET /api/pc/entries - User's own PC entries + linked courses count
router.get("/entries", authMiddleware, async (req, res) => {
  try {
    // Allow optional filtering by programId (program_Id field)
    const match = { createdBy: (req.user.id) };
    if (req.query.programId) match.program_Id = req.query.programId;

    // Lookup VacEntry documents created by this user with same programmeCode
    const entries = await PcDetailsModel.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "vacentries",
          let: { pcProgrammeCode: "$programmeCode", pcUserId: "$createdBy" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: [
                        { $toUpper: "$programmeCode" },
                        { $toUpper: "$$pcProgrammeCode" },
                      ],
                    },
                    { $eq: ["$createdBy", "$$pcUserId"] },
                  ],
                },
              },
            },
            { $project: { _id: 1 } },
          ],
          as: "linkedCoursesInfo",
        },
      },
      {
        $addFields: {
          linkedCoursesCount: { $size: "$linkedCoursesInfo" },
        },
      },
      { $project: { linkedCoursesInfo: 0 } },
      { $sort: { createdAt: -1 } },
    ]);

    res.json(entries);
  } catch (error) {
    console.error("PC Entries error:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch entries" });
  }
});

// GET /api/pc/my-courses - Get coordinator's own VAC courses for form reference
router.get("/my-courses", authMiddleware, async (req, res) => {
  try {
    const courses = await VacEntryModel.find({
      createdBy: req.user.id,
    })
      .select("programmeCode courses createdAt")
      .lean();

    res.json({
      courses,
      programmeCodes: [...new Set(courses.map((c) => c.programmeCode))],
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch courses" });
  }
});

export default router;
