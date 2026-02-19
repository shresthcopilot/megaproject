import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
    vacId: {
        type: String,
        required: false,
        unique: true
    },
    program_Id: {
        type: String,
        default: ""
    },
    studentName: {
        type: String,
        required: true
    },
    enrollmentNumber: {
        type: String,
        required: true,
        unique: true
    },
    phoneNumber: {
        type: String,
        required: true,
        match: /^\d{10}$/
    },
    courseCompleted: {
        type: String,
        required: true,
        enum: ["Yes", "No"]
    },
    sectionSelect: {
        type: String,
        required: true,
        enum: ["A", "B", "C", "D"]
    },
    courseSelect: {
        type: String,
        required: true,
        enum: ["BBA", "BCA", "B.COM", "MBA FT"],
    },
    certificateFilename: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
});

const Student =
  mongoose.models.Student || mongoose.model("Student", studentSchema);

export default Student;
