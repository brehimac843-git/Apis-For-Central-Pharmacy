import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "../db";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_public_key_999";

// 1. REGISTER NEW USER
export async function registerPublicUser(req: Request, res: Response) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const existingUser = await prisma.publicUser.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.publicUser.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: "7d" });

    return res.status(201).json({
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email },
    });
  } catch (error) {
    console.error("Registration Error:", error);
    return res.status(500).json({ message: "Internal server error during registration." });
  }
}

// 2. LOGIN USER
export async function loginPublicUser(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await prisma.publicUser.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password credentials." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password credentials." });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    return res.status(200).json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Internal server error during login." });
  }
}

// 3. GET USER SEARCH HISTORY
export async function getSearchHistory(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;

    const history = await prisma.searchHistory.findMany({
      where: { publicUserId: userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return res.status(200).json(history.map((h) => ({
      id: h.id,
      query: h.query,
      createdAt: h.createdAt,
    })));
  } catch (error) {
    console.error("Fetch History Error:", error);
    return res.status(500).json({ message: "Could not retrieve history logs." });
  }
}

// 4. DELETE A SINGLE HISTORY ITEM
export async function deleteSearchHistoryItem(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!id) {
      return res.status(400).json({ message: "History item id is required." });
    }

    const item = await prisma.searchHistory.findUnique({ where: { id } });
    if (!item || item.publicUserId !== userId) {
      return res.status(404).json({ message: "History item not found." });
    }

    await prisma.searchHistory.delete({ where: { id } });
    return res.status(200).json({ success: true, id });
  } catch (error) {
    console.error("Delete History Item Error:", error);
    return res.status(500).json({ message: "Failed to delete history item." });
  }
}

// 5. CLEAR ENTIRE SEARCH HISTORY
export async function clearSearchHistory(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;

    await prisma.searchHistory.deleteMany({ where: { publicUserId: userId } });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Clear History Error:", error);
    return res.status(500).json({ message: "Failed to clear history logs." });
  }
}

// 6. SAVE SEARCH QUERY TO HISTORY
export async function saveSearchQuery(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    const { query } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ message: "Query string cannot be blank." });
    }

    await prisma.searchHistory.deleteMany({
      where: {
        publicUserId: userId,
        query: { equals: query.trim(), mode: "insensitive" }
      }
    });

    const historyItem = await prisma.searchHistory.create({
      data: {
        publicUserId: userId,
        query: query.trim(),
      },
    });

    return res.status(201).json({
      success: true,
      historyItem: {
        id: historyItem.id,
        query: historyItem.query,
        createdAt: historyItem.createdAt,
      }
    });
  } catch (error) {
    console.error("Save Query Error:", error);
    return res.status(500).json({ message: "Failed to persist history ledger record." });
  }
}