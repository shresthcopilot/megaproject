import express from "express";
import Feedback from "../models/feedback-model.js";

const router = express.Router();

router.post("/save", async (req, res) => {

  try {

    const { feedback, summary } = req.body;

    const newFeedback = new Feedback({
      feedback,
      summary
    });

    await newFeedback.save();

    res.json({ message: "Feedback Saved Successfully" });

  } catch (error) {

    res.status(500).json({ message: "Server Error" });

  }

});

export default router;