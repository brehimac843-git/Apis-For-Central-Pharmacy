import { Request, Response } from "express";
import axios from "axios";
import bcrypt from "bcryptjs";
import { prisma } from "../db.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { syncAgentCreate, syncAgentDelete, syncAgentUpdate, getBranchSyncWarning } from "../services/branchSync.js";

const API_TIMEOUT = 4000;

const normalizePublicUserRow = (row: any) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  photo: row.photo ?? null,
  isActive: row.isActive ?? true,
  createdAt: row.createdAt,
});

const createActivityLog = async (
  agentNumber: string,
  agentName: string,
  pharmacyId: number,
  action: string,
  details?: string
) => {
  await prisma.agentActivityLog.create({
    data: {
      agentNumber,
      agentName,
      pharmacyId,
      action,
      details: details ?? null,
    },
  });
};

export const listPharmacies = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pharmacies = await prisma.pharmacy.findMany({
      include: {
        agents: {
          select: {
            id: true,
            agentNumber: true,
            name: true,
            isActive: true,
          },
        },
      },
    });

    const payload = pharmacies.map((pharmacy) => ({
      ...pharmacy,
      agentCount: pharmacy.agents.length,
      activeAgentCount: pharmacy.agents.filter((agent) => agent.isActive).length,
    }));

    res.json(payload);
  } catch (error) {
    console.error("ADMIN PHARMACY LIST ERROR:", error);
    res.status(500).json({ error: "Unable to fetch pharmacy registry." });
  }
};

export const createPharmacy = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      city,
      address,
      phone,
      email,
      api_url,
      latitude,
      longitude,
      amo_supported,
    } = req.body;

    if (!name || !city || !address || !phone || !email || !api_url || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "All pharmacy fields are required except AMO support." });
    }

    const newPharmacy = await prisma.pharmacy.create({
      data: {
        name: String(name),
        city: String(city),
        address: String(address),
        phone: String(phone),
        email: String(email),
        api_url: String(api_url),
        latitude: Number(latitude),
        longitude: Number(longitude),
        amo_supported: Boolean(amo_supported),
      },
    });

    await createActivityLog(
      req.user?.adminId ?? "ADMIN",
      req.user?.email ?? "Central Admin",
      newPharmacy.id,
      "PHARMACY_CREATED",
      `Central admin created pharmacy ${newPharmacy.name}`
    );

    res.status(201).json(newPharmacy);
  } catch (error) {
    console.error("ADMIN CREATE PHARMACY ERROR:", error);
    res.status(500).json({ error: "Failed to create pharmacy record." });
  }
};

export const updatePharmacy = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pharmacyId = Number(req.params.id);
    const {
      name,
      city,
      address,
      phone,
      email,
      api_url,
      latitude,
      longitude,
      amo_supported,
    } = req.body;

    const updatedPharmacy = await prisma.pharmacy.update({
      where: { id: pharmacyId },
      data: {
        name: name !== undefined ? String(name) : undefined,
        city: city !== undefined ? String(city) : undefined,
        address: address !== undefined ? String(address) : undefined,
        phone: phone !== undefined ? String(phone) : undefined,
        email: email !== undefined ? String(email) : undefined,
        api_url: api_url !== undefined ? String(api_url) : undefined,
        latitude: latitude !== undefined ? Number(latitude) : undefined,
        longitude: longitude !== undefined ? Number(longitude) : undefined,
        amo_supported: amo_supported !== undefined ? Boolean(amo_supported) : undefined,
      },
    });

    await createActivityLog(
      req.user?.adminId ?? "ADMIN",
      req.user?.email ?? "Central Admin",
      updatedPharmacy.id,
      "PHARMACY_UPDATED",
      `Central admin updated pharmacy ${updatedPharmacy.name}`
    );

    res.json(updatedPharmacy);
  } catch (error) {
    console.error("ADMIN UPDATE PHARMACY ERROR:", error);
    res.status(500).json({ error: "Failed to update pharmacy record." });
  }
};

export const deletePharmacy = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pharmacyId = Number(req.params.id);
    const pharmacy = await prisma.pharmacy.findUnique({ where: { id: pharmacyId } });

    if (!pharmacy) {
      return res.status(404).json({ error: "Pharmacy not found." });
    }

    await prisma.drugVisibility.deleteMany({ where: { pharmacyId } });
    await prisma.agentActivityLog.deleteMany({ where: { pharmacyId } });
    await prisma.agentRecord.deleteMany({ where: { pharmacyId } });
    await prisma.pharmacy.delete({ where: { id: pharmacyId } });

    // Logs associated with this pharmacy are deleted as part of registry cleanup.
    res.json({ message: "Pharmacy removed successfully." });
  } catch (error) {
    console.error("ADMIN DELETE PHARMACY ERROR:", error);
    res.status(500).json({ error: "Failed to delete pharmacy record." });
  }
};

export const listAgents = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const agents = await prisma.agentRecord.findMany({
      include: {
        pharmacy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(
      agents.map((agent) => ({
        ...agent,
        pharmacyName: agent.pharmacy?.name ?? "Unknown Pharmacy",
      }))
    );
  } catch (error) {
    console.error("ADMIN AGENT LIST ERROR:", error);
    res.status(500).json({ error: "Unable to fetch agent roster." });
  }
};

export const createAgent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { agentNumber, name, pharmacyId, isActive } = req.body;

    if (!agentNumber || !name || !pharmacyId) {
      return res.status(400).json({ error: "Agent number, name, and pharmacy assignment are required." });
    }

    const pharmacy = await prisma.pharmacy.findUnique({
      where: { id: Number(pharmacyId) },
      select: { id: true, api_url: true, name: true },
    });

    if (!pharmacy) {
      return res.status(404).json({ error: "Pharmacy not found." });
    }

    const active = isActive !== undefined ? Boolean(isActive) : true;
    let branchSyncWarning: string | undefined;

    if (active) {
      try {
        await syncAgentCreate(pharmacy.api_url, String(agentNumber), String(name));
      } catch (err: any) {
        console.error("BRANCH AGENT CREATE SYNC ERROR:", err.message || err);
        branchSyncWarning = getBranchSyncWarning(err, pharmacy.name);
      }
    }

    const agent = await prisma.agentRecord.create({
      data: {
        agentNumber: String(agentNumber),
        name: String(name),
        pharmacyId: Number(pharmacyId),
        isActive: active,
      },
    });

    await createActivityLog(
      req.user?.adminId ?? "ADMIN",
      req.user?.email ?? "Central Admin",
      Number(pharmacyId),
      "AGENT_CREATED",
      `Created agent ${agent.agentNumber} for pharmacy ${agent.pharmacyId}`
    );

    res.status(201).json(branchSyncWarning ? { ...agent, warning: branchSyncWarning } : agent);
  } catch (error) {
    console.error("ADMIN CREATE AGENT ERROR:", error);
    res.status(500).json({ error: "Unable to create agent record." });
  }
};

export const updateAgent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const agentId = String(req.params.id);
    const { name, isActive, pharmacyId } = req.body;

    const existingAgent = await prisma.agentRecord.findUnique({ where: { id: agentId } });
    if (!existingAgent) {
      return res.status(404).json({ error: "Agent record not found." });
    }

    const targetPharmacyId =
      pharmacyId !== undefined ? Number(pharmacyId) : existingAgent.pharmacyId;
    const targetActive = isActive !== undefined ? Boolean(isActive) : existingAgent.isActive;
    const targetName = name !== undefined ? String(name) : existingAgent.name;
    const isReactivating = !existingAgent.isActive && targetActive;

    const oldPharmacy = await prisma.pharmacy.findUnique({
      where: { id: existingAgent.pharmacyId },
      select: { api_url: true },
    });
    const newPharmacy = await prisma.pharmacy.findUnique({
      where: { id: targetPharmacyId },
      select: { api_url: true, name: true },
    });

    if (!newPharmacy) {
      return res.status(404).json({ error: "Target pharmacy not found." });
    }

    let branchSyncWarning: string | undefined;

    try {
      if (existingAgent.pharmacyId !== targetPharmacyId && oldPharmacy) {
        await syncAgentDelete(oldPharmacy.api_url, existingAgent.agentNumber);
      }

      if (targetActive) {
        if (existingAgent.pharmacyId !== targetPharmacyId || isReactivating) {
          await syncAgentCreate(newPharmacy.api_url, existingAgent.agentNumber, targetName);
        } else {
          await syncAgentUpdate(
            newPharmacy.api_url,
            existingAgent.agentNumber,
            targetName,
            true
          );
        }
      } else {
        await syncAgentDelete(newPharmacy.api_url, existingAgent.agentNumber);
      }
    } catch (err: any) {
      console.error("BRANCH AGENT UPDATE SYNC ERROR:", err.message || err);
      branchSyncWarning = getBranchSyncWarning(err, newPharmacy.name);
    }

    const updatedAgent = await prisma.agentRecord.update({
      where: { id: agentId },
      data: {
        name: name !== undefined ? String(name) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        pharmacyId: pharmacyId !== undefined ? Number(pharmacyId) : undefined,
      },
    });

    await createActivityLog(
      req.user?.adminId ?? "ADMIN",
      req.user?.email ?? "Central Admin",
      updatedAgent.pharmacyId,
      "AGENT_UPDATED",
      `Admin updated agent ${updatedAgent.agentNumber}`
    );

    res.json(branchSyncWarning ? { ...updatedAgent, warning: branchSyncWarning } : updatedAgent);
  } catch (error) {
    console.error("ADMIN UPDATE AGENT ERROR:", error);
    res.status(500).json({ error: "Unable to update agent record." });
  }
};

export const deleteAgent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const agentId = String(req.params.id);
    const existingAgent = await prisma.agentRecord.findUnique({ where: { id: agentId } });

    if (!existingAgent) {
      return res.status(404).json({ error: "Agent record not found." });
    }

    const pharmacy = await prisma.pharmacy.findUnique({
      where: { id: existingAgent.pharmacyId },
      select: { api_url: true, name: true },
    });

    let branchSyncWarning: string | undefined;

    if (pharmacy) {
      try {
        await syncAgentDelete(pharmacy.api_url, existingAgent.agentNumber);
      } catch (err: any) {
        console.error("BRANCH AGENT DELETE SYNC ERROR:", err.message || err);
        branchSyncWarning = getBranchSyncWarning(err, pharmacy.name);
      }
    }

    await prisma.agentRecord.delete({ where: { id: agentId } });

    await createActivityLog(
      req.user?.adminId ?? "ADMIN",
      req.user?.email ?? "Central Admin",
      existingAgent.pharmacyId,
      "AGENT_DELETED",
      `Deleted agent ${existingAgent.agentNumber}`
    );

    res.json(
      branchSyncWarning
        ? { message: "Agent removed successfully.", warning: branchSyncWarning }
        : { message: "Agent removed successfully." }
    );
  } catch (error) {
    console.error("ADMIN DELETE AGENT ERROR:", error);
    res.status(500).json({ error: "Unable to delete agent record." });
  }
};

export const listPublicUsers = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await prisma.publicUser.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        photo: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.json(users.map(normalizePublicUserRow));
  } catch (error) {
    console.error("ADMIN PUBLIC USER LIST ERROR:", error);
    res.status(500).json({ error: "Unable to fetch system users." });
  }
};

export const createPublicUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, password, isActive } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required." });
    }

    const normalizedEmail = String(email).toLowerCase();
    const existingUser = await prisma.publicUser.findUnique({ where: { email: normalizedEmail } });

    if (existingUser) {
      return res.status(409).json({ error: "A user with that email already exists." });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);
    const user = await prisma.publicUser.create({
      data: {
        name: String(name),
        email: normalizedEmail,
        password: hashedPassword,
        photo: null,
        isActive: Boolean(isActive ?? true),
      },
      select: {
        id: true,
        name: true,
        email: true,
        photo: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.status(201).json(normalizePublicUserRow(user));
  } catch (error) {
    console.error("ADMIN CREATE PUBLIC USER ERROR:", error);
    res.status(500).json({ error: "Unable to create system user." });
  }
};

export const updatePublicUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = String(req.params.id);
    const { name, email, password, isActive } = req.body;

    const existingUser = await prisma.publicUser.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return res.status(404).json({ error: "System user not found." });
    }

    const data: any = {};

    if (name !== undefined) {
      data.name = String(name);
    }

    if (email !== undefined) {
      const normalizedEmail = String(email).toLowerCase();
      const duplicate = await prisma.publicUser.findFirst({
        where: {
          email: normalizedEmail,
          id: { not: userId },
        },
      });

      if (duplicate) {
        return res.status(409).json({ error: "A user with that email already exists." });
      }

      data.email = normalizedEmail;
    }

    if (password !== undefined && String(password).trim()) {
      data.password = await bcrypt.hash(String(password), 10);
    }

    if (isActive !== undefined) {
      data.isActive = Boolean(isActive);
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "No user fields were provided for update." });
    }

    const updatedUser = await prisma.publicUser.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        photo: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.json(normalizePublicUserRow(updatedUser));
  } catch (error) {
    console.error("ADMIN UPDATE PUBLIC USER ERROR:", error);
    res.status(500).json({ error: "Unable to update system user." });
  }
};

export const deletePublicUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = String(req.params.id);

    const existingUser = await prisma.publicUser.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return res.status(404).json({ error: "System user not found." });
    }

    await prisma.publicUser.delete({ where: { id: userId } });

    res.json({ message: "User removed successfully." });
  } catch (error) {
    console.error("ADMIN DELETE PUBLIC USER ERROR:", error);
    res.status(500).json({ error: "Unable to delete system user." });
  }
};

export const listActivityLogs = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await prisma.agentActivityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 120,
      include: {
        pharmacy: {
          select: { name: true },
        },
      },
    });

    res.json(
      logs.map((entry) => ({
        id: entry.id,
        agentNumber: entry.agentNumber,
        agentName: entry.agentName,
        pharmacyName: entry.pharmacy?.name ?? "Unknown Pharmacy",
        pharmacyId: entry.pharmacyId,
        action: entry.action,
        details: entry.details,
        createdAt: entry.createdAt,
      }))
    );
  } catch (error) {
    console.error("ADMIN ACTIVITY LOG LIST ERROR:", error);
    res.status(500).json({ error: "Unable to fetch activity logs." });
  }
};

export const getPharmacyStock = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pharmacyId = Number(req.params.id);
    const pharmacy = await prisma.pharmacy.findUnique({
      where: { id: pharmacyId },
      select: { id: true, name: true, api_url: true },
    });

    if (!pharmacy) {
      return res.status(404).json({ error: "Pharmacy node not found." });
    }

    try {
      const stockRes = await axios.get(`${pharmacy.api_url}/api/public-stock`, {
        timeout: API_TIMEOUT,
      });

      res.json({ pharmacy: { id: pharmacy.id, name: pharmacy.name }, stock: stockRes.data });
    } catch (err: any) {
      console.error("ADMIN PHARMACY STOCK FETCH ERROR:", err.message || err);
      return res.status(502).json({
        error: `Unable to fetch live stock from branch node at ${pharmacy.api_url}`,
      });
    }
  } catch (error) {
    console.error("ADMIN PHARMACY STOCK ERROR:", error);
    res.status(500).json({ error: "Unable to retrieve pharmacy stock data." });
  }
};
