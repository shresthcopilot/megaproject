import mongoose from "mongoose";

const schema = new mongoose.Schema({

type:String,
output:String,
students:Number,
mou:String,
activity:String,
doc:String

});

export default mongoose.model("Collaboration",schema);