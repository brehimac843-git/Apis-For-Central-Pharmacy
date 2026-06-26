import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_pharmacy_key_2026";

// Extend Express Request type to safely carry our unpacked token payload
export interface AuthenticatedRequest extends Request {
  user?: {
    role: string;
    adminId?: string;
    pharmacyId?: number;
    email?: string;
    agentName?: string;
  };
}

// 🛡️ Middleware to enforce valid token authentication
export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No authentication token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded; // Attach the payload permissions to the request flow
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid, altered, or expired security token." });
  }
};

// 👑 Middleware to restrict endpoints to high-clearance Central Administrators only
export const requireCentralAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "CENTRAL_ADMIN") {
    return res.status(403).json({ error: "Unauthorized access. Central Admin credentials required." });
  }
  next();
};
