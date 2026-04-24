import mongoose from "mongoose";

const schema = new mongoose.Schema({
activity:String,
resource:String,
students:Number,
details:String,
participated:String,
doc:String
});

export default mongoose.model("Events", schema);