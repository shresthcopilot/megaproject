import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({

  feedback: String,
  summary: String,

  createdAt: {
    type: Date,
    default: Date.now
  }

});

export default mongoose.model("Feedback", feedbackSchema);