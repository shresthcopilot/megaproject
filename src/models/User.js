import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        lowercase: true,
        enum: ["faculty", "pc", "vac", "admin", "e-content", "e-capacity", "teaching-learning", "experiential", "learner-support", "library"]
    },
});

// Compound unique index: same username can exist with different roles
userSchema.index({ username: 1, role: 1 }, { unique: true });

const User = mongoose.model("User", userSchema);

export default User;
