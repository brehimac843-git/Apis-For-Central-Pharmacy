import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { 
  registerPublicUser, 
  loginPublicUser,
  verifyPublicUser,
  updateProfilePhoto,
  getSearchHistory, 
  saveSearchQuery,
  saveBulkSearchHistory,
  deleteSearchHistoryItem,
  clearSearchHistory
} from "../controllers/publicUserController";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_public_key_999";

// 🛡️ JWT Authentication Middleware Guard
function verifyToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Format: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: "Access denied. Token missing." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Session expired or invalid token structure." });
  }
}

// 🔓 Public Auth Access Gateways
router.post("/public/register", registerPublicUser);
router.post("/public/signup", registerPublicUser);
router.post("/public/login", loginPublicUser);
router.get("/public/verify", verifyToken, verifyPublicUser);
router.put("/public/profile/photo", verifyToken, updateProfilePhoto);

// 🔒 Protected Personalized Consumer History Routes
router.get("/public/history", verifyToken, getSearchHistory);
router.post("/public/history", verifyToken, saveSearchQuery);
router.post("/public/history/bulk", verifyToken, saveBulkSearchHistory);
router.delete("/public/history", verifyToken, clearSearchHistory);
router.delete("/public/history/:id", verifyToken, deleteSearchHistoryItem);

export default router;