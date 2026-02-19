import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  vacId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "VacEntry",
    required: false,
  },

  program_Id: {
    type: String,
    default: "",
    trim: true,
  },

  studentName: {
    type: String,
    required: true,
    trim: true,
  },

  department: {
    type: String,
    required: true,
    enum: ["IT", "Management", "Commerce", "Law"],
  },

  level: {
    type: String,
    required: true,
    enum: ["UG", "PG"],
  },

  course: {
    type: String,
    required: true,
    enum: ["BCA", "MCA", "BBA", "MBA", "B.Com", "LLB", "LLM"],
  },

  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 6,
  },

  enrollmentNumber: {
    type: String,
    required: true,
    
    trim: true,
  },

  phoneNumber: {
    type: String,
    required: true,
    match: /^\d{10}$/,
  },

  courseCompleted: {
    type: String,
    required: true,
    enum: ["Yes", "No"],
  },

  certificateFilename: {
    type: String,
    default: "",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Student =
  mongoose.models.Student || mongoose.model("Student", studentSchema);

export default Student;
