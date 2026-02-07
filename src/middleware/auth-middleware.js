import jwt from "jsonwebtoken";
import { ApiError } from "../utils/api-error.js";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

// Extract token from multiple locations
const extractToken = (req) => {
  const header = req.headers.authorization || "";

  if (header.startsWith("Bearer ")) {
    return header.split(" ")[1];
  }

  if (req.cookies?.token) {
    return req.cookies.token;
  }

  return null;
};


// Middleware: authentication required
export const authMiddleware = (req, res, next) => {
    const token = extractToken(req);
    if (!token) return next(new ApiError(401, "No token, authorization denied"));

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        return next();
    } catch (err) {
        return next(new ApiError(401, "Invalid or expired token"));
    }
};

// Middleware: optional authentication
export const optionalAuth = (req, res, next) => {
    const token = extractToken(req);
    if (!token) return next();
    try {
        req.user = jwt.verify(token, JWT_SECRET);
    } catch (err) {
        // ignore invalid token
    }
    return next();
};

// Middleware: role-based access
export const requireRole = (roles) => (req, res, next) => {
    if (!req.user) return next(new ApiError(401, "Not authenticated"));
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (!allowedRoles.includes(req.user.role)) {
        return next(new ApiError(403, "Forbidden: insufficient role"));
    }
    return next();
};

// export default
export default authMiddleware;
