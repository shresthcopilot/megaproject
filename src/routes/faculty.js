import express from "express";
import Faculty from "../models/faculty-model.js";

const router = express.Router();

// 🔹 GET ALL
router.get("/", async (req, res) => {
    try {
        const faculty = await Faculty.find().lean();
        res.status(200).json(faculty || []);
    } catch (error) {
        console.error("Error fetching faculty:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 🔹 CREATE
router.post("/", async (req, res) => {
    try {
        const { name, designation, department, qualification } = req.body;
        
        if (!name || !designation || !department || !qualification) {
            return res.status(400).json({ 
                success: false, 
                message: "Name, designation, department, and qualification are required" 
            });
        }
        
        const newFaculty = new Faculty({ name, designation, department, qualification });
        const saved = await newFaculty.save();
        res.status(201).json({ success: true, data: saved, message: "Faculty created successfully" });
    } catch (error) {
        console.error("Error creating faculty:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 🔹 UPDATE
router.put("/:id", async (req, res) => {
    try {
        const updated = await Faculty.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updated) {
            return res.status(404).json({ success: false, message: "Faculty not found" });
        }
        res.status(200).json({ success: true, data: updated, message: "Faculty updated successfully" });
    } catch (error) {
        console.error("Error updating faculty:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 🔹 DELETE
router.delete("/:id", async (req, res) => {
    try {
        const deleted = await Faculty.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: "Faculty not found" });
        }
        res.status(200).json({ success: true, message: "Faculty deleted successfully" });
    } catch (error) {
        console.error("Error deleting faculty:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
