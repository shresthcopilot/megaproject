import mongoose from "mongoose";

const schema = new mongoose.Schema({
  minutes: String,
  atr: String,
  doc: String
});

export default mongoose.model("Governing", schema);