// src/middleware/page-auth.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

export const pageAuthMiddleware = (req, res, next) => {
  const token =
    req.cookies?.token ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null);

  // Detect browser page request
  const isBrowserRequest =
    req.accepts("html") && !req.path.startsWith("/api");

  if (!token) {
    return isBrowserRequest
      ? res.redirect("/")
      : res.status(401).json({ message: "Unauthorized" });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return isBrowserRequest
      ? res.redirect("/")
      : res.status(401).json({ message: "Invalid or expired token" });
  }
};
