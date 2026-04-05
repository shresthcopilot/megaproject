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
// Detect API request
const isApiRequest = (req) => {
  return (
    req.headers.accept?.includes("application/json") ||
    req.originalUrl.startsWith("/api")
  );
};


// Middleware: authentication required
export const authMiddleware = (req, res, next) => {
  const token = extractToken(req);

  // ❌ No token
  if (!token) {
    if (isApiRequest(req)) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Please login first.",
      });
    } else {
      return res.redirect("/login");
    }
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    console.error("Auth Error:", err.message);

    // 🔥 Token expired
    if (err.name === "TokenExpiredError") {
      if (isApiRequest(req)) {
        return res.status(401).json({
          success: false,
          message: "Session expired. Please login again.",
        });
      } else {
        return res.redirect("/");
      }
    }

    // 🔥 Invalid token
    if (isApiRequest(req)) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please login again.",
      });
    } else {
      return res.redirect("/login?error=invalid");
    }
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
