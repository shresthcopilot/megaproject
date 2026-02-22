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

// Get all users
router.get("/users", async (req, res) => {
    try {
        const users = await User.find({}, { password: 0 }).exec();
        
        if (!users || users.length === 0) {
            return res.json({
                success: true,
                data: [],
                message: "No users found"
            });
        }

        res.json({
            success: true,
            data: users,
            message: "Users fetched successfully"
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            error: "Server error"
        });
    }
});

// Get user by ID
router.get("/users/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id, { password: 0 }).exec();
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found"
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            error: "Server error"
        });
    }
});

// Update user
router.put("/users/:id", async (req, res) => {
    try {
        const { username, role, password } = req.body;
        const userId = req.params.id;

        if (!username || !role) {
            return res.status(400).json({
                success: false,
                error: "Username and role are required"
            });
        }

        // Check if new username/role combination already exists (excluding current user)
        const existing = await User.findOne({
            username,
            role,
            _id: { $ne: userId }
        }).exec();

        if (existing) {
            return res.status(409).json({
                success: false,
                error: "User already exists with this username and role"
            });
        }

        // Prepare update object
        const updateData = { 
            username, 
            role: role.toLowerCase() 
        };

        // Hash and include password if provided
        if (password) {
            updateData.password = await bcrypt.hash(password, saltRounds);
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select("-password");

        res.json({
            success: true,
            data: updatedUser,
            message: "User updated successfully"
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            error: "Server error"
        });
    }
});

// Delete user
router.delete("/users/:id", async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id).exec();

        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found"
            });
        }

        res.json({
            success: true,
            message: "User deleted successfully"
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            error: "Server error"
        });
    }
});

// re-export shared auth middleware from middleware folder
export { authMiddleware } from "../middleware/jwt-middleware.js";


export default router;