import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
const saltRounds = 10;

router.post("/register", async (req, res) => {
    try {
        const { username, password, role } = req.body;

        if (!username || !password || !role)
            return res
                .status(400)
                .json({ error: 'username, password and role are required' });


        const existing = await User
            .findOne({ username, role })
            .exec();

        if (existing)
            return res
                .status(409)
                .json({ error: 'User already exists for the given role' });

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const user = new User({ username, password: hashedPassword, role });
        await user.save();

        res.json({ message: "User registered successfully" });
    } catch (err) {
        console.error(err);
        res
            .status(500)
            .json({ error: "Server error" });
    }
});

// Login route - compare hashed password
router.post("/login", async (req, res) => {
    try {
        const { username, password, role } = req.body;

        if (!username || !password || !role)
            return res
                .status(400)
                .json({ error: 'username, password and role are required' });

        console.log("=== LOGIN DEBUG ===");
        console.log("Received credentials:", { username, role });

        const user = await User.findOne({ username, role }).exec();

        console.log("User found:", user ? "YES" : "NO");
        if (!user) {
            console.log("Looking for:", { username, role });
            // Show all users with this username (any role)
            const allUsers = await User.find({ username }).exec();
            console.log("Users with username '" + username + "':", allUsers.map(u => ({ username: u.username, role: u.role })));

            return res
                .status(404)
                .json({ error: "User not found" });
        }

        const pw = user.password || '';
        let isMatch = false;

        if (pw.startsWith('$2')) {
            isMatch = await bcrypt
                .compare(password, pw);
        } else if (pw === password) {
            // legacy store: plaintext match — migrate to hashed password
            try {
                const newHash = await bcrypt.hash(password, saltRounds);
                user.password = newHash;
                await user.save();
                isMatch = true;
            } catch (e) {
                console.error('Password migration failed', e);
            }
        }

        if (!isMatch)
            return res
                .status(401)
                .json({ error: "Wrong password" });

        const token = jwt
            .sign(
                {
                    id: user._id,
                    role: user.role
                },
                JWT_SECRET, { expiresIn: "1h" });

        res.json({
            message: "Login successful",
            token,
            role: user.role,
            user: user.username,
        });
    }
    catch (err) {
        console.error(err);
        res
            .status(500)
            .json({ error: "Server error" });
    }
});

// re-export shared auth middleware from middleware folder
export { authMiddleware } from "../middleware/jwt-middleware.js";


export default router;