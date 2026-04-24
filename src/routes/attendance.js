import express from "express";
import Attendance from "../models/attendance-model.js";
import { authMiddleware } from "../middleware/auth-middleware.js";

const router = express.Router();

// @route   POST /api/attendance/mark
// @desc    Mark attendance for a class
router.post("/mark", authMiddleware, async (req, res) => {
  try {
    const { date, teacherName, session, studentClass, subject, attendance } = req.body;

    // Exception handling: Basic Validation
    if (!date || !session || !studentClass || !subject || !attendance) {
      console.warn("Validation failed: Missing fields", { date, session, studentClass, subject });
      return res.status(400).json({ error: "All fields are required: Date, Session, Class, Subject, and Attendance data." });
    }

    // Security: Only Admin or the respective Faculty should be able to mark attendance
    // Note: If we had 'username' in the token, we could verify: 
    // if (req.user.role === 'faculty' && req.user.username !== teacherName) ...

    // Convert status codes to full names and filter empty
    const statusMap = {
      "P": "Present",
      "A": "Absent",
      "L": "Leave"
    };

    const finalRecords = {};
    for (const [studentName, status] of Object.entries(attendance)) {
      if (status && status.trim() !== "") {
        finalRecords[studentName] = statusMap[status] || status;
      }
    }

    if (Object.keys(finalRecords).length === 0) {
      return res.status(400).json({ error: "No attendance records provided or all are empty." });
    }

    // Exception handling: DB operations
    let existingRecord;
    try {
      existingRecord = await Attendance.findOne({ date, session, studentClass, subject });
    } catch (dbErr) {
      console.error("Database Lookup Error:", dbErr);
      return res.status(500).json({ error: "Failed to verify existing records. Please try again." });
    }

    if (existingRecord) {
      existingRecord.records = finalRecords;
      existingRecord.teacherName = teacherName; 
      await existingRecord.save();
    } else {
      const newAttendance = new Attendance({
        date,
        teacherName,
        session,
        studentClass,
        subject,
        records: finalRecords,
      });
      await newAttendance.save();
    }

    res.status(200).json({ message: "Attendance saved successfully!", count: Object.keys(finalRecords).length });
  } catch (error) {
    console.error("Critical Error in /mark:", error);
    res.status(500).json({ error: "Internal server error. We've logged this issue." });
  }
});

// @route   GET /api/attendance/students
// @desc    Get student list for a given class
const studentDataMap = {
    "BCA 1 SEM": ["Aman", "Rohit", "Kartik", "Rohan", "Aryan"],
    "BCA 2 SEM": ["Neha", "Simran", "Priyanshi", "Priya", "Ananya"],
    "BCA 3 SEM": ["Rahul", "Arjun", "Vinay", "Vikas", "Sumit"],
    "BCA 4 SEM": ["Abhay", "Abhishek", "Anjali", "Aditya", "Ishaan"],
    "BCA 5 SEM": ["Vikram", "Saurav", "Manish", "Kunal", "Deepak"],
    "BCA 6 SEM": ["Sameer", "Varun", "Harsh", "Yash", "Prateek"],
    
    "BBA 1 SEM": ["Sakshi", "Tina", "Reena", "Riya", "Kavya"],
    "BBA 2 SEM": ["Mohit", "Ravi", "Amit", "Sunny", "Gaurav"],
    "BBA 3 SEM": ["Pooja", "Nikita", "Ajay", "Sneha", "Muskan"],
    "BBA 4 SEM": ["Manish", "Deepak", "Suman", "Sumit", "Rajat"],
    "BBA 5 SEM": ["Sanjay", "Rajesh", "Pooja", "Aarti", "Megha"],
    "BBA 6 SEM": ["Vishal", "Rahul", "Sapna", "Kiran", "Jyoti"],
    
    "B.COM 1 SEM": ["Karan", "Kunal", "Meera", "Swati", "Shreya"],
    "B.COM 2 SEM": ["Nitin", "Praveen", "Rashi", "Ritika", "Muskan"],
    "B.COM 3 SEM": ["Harsh", "Himanshu", "Gaurav", "Gargi", "Ishita"],
    "B.COM 4 SEM": ["Varun", "Vaibhav", "Tanya", "Tarun", "Shuchi"],
    "B.COM 5 SEM": ["Yash", "Yuvraj", "Zoya", "Zeus", "Akash"],
    "B.COM 6 SEM": ["Abhinav", "Aditi", "Bhavya", "Bharat", "Chetan"],
    
    "LAW 1 SEM": ["Sachin", "Saurabh", "Shruti", "Sanya", "Tripti"],
    "LAW 2 SEM": ["Prateek", "Piyush", "Prerna", "Priyanka", "Nidhi"],
    "LAW 3 SEM": ["Lalit", "Lakshya", "Lina", "Lata", "Monu"],
    "LAW 4 SEM": ["Chirag", "Chetan", "Charu", "Chhavi", "Bhavna"],
    "LAW 5 SEM": ["Dev", "Dhruv", "Disha", "Divya", "Ekta"],
    "LAW 6 SEM": ["Eshan", "Ekta", "Farhan", "Fatima", "Gagan"]
};

router.get("/students", authMiddleware, (req, res) => {
    try {
        const className = req.query.class;
        if (!className) {
            return res.status(400).json({ error: "Class parameter is required" });
        }
        
        let students = studentDataMap[className];
        
        // Fallback for sections: If "BCA 1 SEM A" not found, check "BCA 1 SEM"
        if (!students) {
            const baseClass = className.replace(/ [A-B]$/, "");
            students = studentDataMap[baseClass];
        }

        if (!students || students.length === 0) {
            students = [
                `Roll 1 (${className})`,
                `Roll 2 (${className})`,
                `Roll 3 (${className})`,
                `Roll 4 (${className})`,
                `Roll 5 (${className})`
            ];
        }
        res.status(200).json({ students });
    } catch (error) {
        console.error("Error fetching students:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
