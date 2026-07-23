import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "../db.js";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_public_key_999";

const getPublicUserByEmail = async (email: string) => {
  return prisma.publicUser.findUnique({
    where: { email: String(email).toLowerCase() },
  });
};

const getPublicUserById = async (userId: string) => {
  return prisma.publicUser.findUnique({
    where: { id: userId },
  });
};

function formatPublicUser(user: {
  id: string;
  name: string;
  email: string;
  photo: string | null;
  isActive?: boolean;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    photo: user.photo ?? null,
    isActive: user.isActive ?? true,
  };
}

// 1. REGISTER NEW USER
export async function registerPublicUser(req: Request, res: Response) {
  try {
    const { name, email, password, photo } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const normalizedEmail = String(email).toLowerCase();
    const existingUser = await getPublicUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);
    const photoValue = typeof photo === "string" && photo.trim() ? photo.trim() : null;

    const newUser = await prisma.publicUser.create({
      data: {
        name: String(name),
        email: normalizedEmail,
        password: hashedPassword,
        photo: photoValue,
        isActive: true,
      },
    });
    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: "7d" });

    return res.status(201).json({
      token,
      user: formatPublicUser(newUser),
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

    const user = await getPublicUserByEmail(String(email));
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password credentials." });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "This account is inactive. Please contact an administrator." });
    }

    const isPasswordValid = await bcrypt.compare(String(password), user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password credentials." });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    return res.status(200).json({
      token,
      user: formatPublicUser(user),
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Internal server error during login." });
  }
}

// 2b. VERIFY SESSION AND REFRESH USER PROFILE
export async function verifyPublicUser(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;

    const user = await getPublicUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({ user: formatPublicUser(user) });
  } catch (error) {
    console.error("Verify User Error:", error);
    return res.status(500).json({ message: "Could not verify session." });
  }
}

// 2c. UPDATE PROFILE PHOTO
export async function updateProfilePhoto(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    const { photo } = req.body;

    if (typeof photo !== "string" || !photo.trim()) {
      return res.status(400).json({ message: "A valid profile photo is required." });
    }

    const updatedUser = await prisma.publicUser.update({
      where: { id: userId },
      data: { photo: photo.trim() },
    });

    return res.status(200).json({ user: formatPublicUser(updatedUser) });
  } catch (error) {
    console.error("Update Profile Photo Error:", error);
    return res.status(500).json({ message: "Failed to update profile photo." });
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
      type: h.type ?? "single",
      payload: h.payload ?? null,
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
        type: "single",
      },
    });

    return res.status(201).json({
      success: true,
      historyItem: {
        id: historyItem.id,
        query: historyItem.query,
        type: historyItem.type,
        payload: historyItem.payload,
        createdAt: historyItem.createdAt,
      }
    });
  } catch (error) {
    console.error("Save Query Error:", error);
    return res.status(500).json({ message: "Failed to persist history ledger record." });
  }
}

// 7. SAVE BULK SEARCH TO HISTORY
export async function saveBulkSearchHistory(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    const { results } = req.body;

    if (!results || !Array.isArray(results.drugResults)) {
      return res.status(400).json({ message: "Valid bulk search results are required." });
    }

    const historyItem = await prisma.searchHistory.create({
      data: {
        publicUserId: userId,
        query: "Bulk search",
        type: "bulk",
        payload: results,
      },
    });

    return res.status(201).json({
      success: true,
      historyItem: {
        id: historyItem.id,
        query: historyItem.query,
        type: historyItem.type,
        payload: historyItem.payload,
        createdAt: historyItem.createdAt,
      },
    });
  } catch (error) {
    console.error("Save Bulk Search History Error:", error);
    return res.status(500).json({ message: "Failed to persist bulk search history." });
  }
}