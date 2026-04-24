import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
  },
  teacherName: {
    type: String,
    required: false,
  },
  session: {
    type: String,
    required: true,
  },
  studentClass: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  records: {
    type: Map,
    of: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Attendance = mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);
export default Attendance;
