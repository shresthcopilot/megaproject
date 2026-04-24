import express from "express";
import Model from "../models/events-model.js";

const router = express.Router();

router.post("/save", async (req,res)=>{
try{
const data = new Model(req.body);
await data.save();
res.json({message:"Saved"});
}catch(err){
res.status(500).json({message:"Error"});
}
});

export default router;