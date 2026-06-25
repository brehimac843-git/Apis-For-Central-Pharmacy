import { Request, Response } from "express";
import axios from "axios";
import jwt from "jsonwebtoken";
import { prisma } from "../db";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_pharmacy_key_2026";

// 🛠️ TEST SWITCH: Set to true to bypass remote port 3001 connection checks during local UI testing
const MOCK_BRANCH_VALIDATION = false;

const logAgentLogin = async (
  agentNumber: string,
  agentName: string,
  pharmacyId: number,
  action: string,
  details?: string
) => {
  await prisma.agentRecord.upsert({
    where: { agentNumber },
    update: {
      name: agentName,
      pharmacyId,
      isActive: true,
    },
    create: {
      agentNumber,
      name: agentName,
      pharmacyId,
      isActive: true,
    },
  });

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

// 1. LOCALIZED PHARMACY AGENT LOGIN
export const agentLogin = async (req: Request, res: Response) => {
  try {
    const { pharmacyId, agentNumber } = req.body;

    if (!pharmacyId || !agentNumber) {
      return res.status(400).json({ error: "Pharmacy selection and Agent Number are required" });
    }

    // Look up the chosen pharmacy to find its unique microservice API URL
    const pharmacy = await prisma.pharmacy.findUnique({
      where: { id: Number(pharmacyId) }
    });

    if (!pharmacy) {
      return res.status(404).json({ error: "Selected pharmacy not found in aggregator system" });
    }

    let isVerified = false;
    let verifiedAgentName = "Pharmacy Agent";

    if (MOCK_BRANCH_VALIDATION) {
      // 🚀 Bypassing the network loop for rapid frontend verification
      console.log(`🧪 Mocking successful verification for agent ${agentNumber} at ${pharmacy.name}`);
      isVerified = true;
      verifiedAgentName = "Mock Agent Account";
    } else {
      try {
        // 🤝 Forward verification down to the remote branch node API
        const remoteCheck = await axios.post(
          `${pharmacy.api_url}/api/internal/verify-agent`, 
          { agentNumber },
          { timeout: 2000 } 
        );

        if (remoteCheck.data && remoteCheck.data.verified === true) {
          isVerified = true;
          verifiedAgentName = remoteCheck.data.agentName || "Pharmacy Agent";
        }
      } catch (networkError: any) {
        console.error(`Authentication gateway failure connecting to ${pharmacy.name}:`, networkError.message);
        
        if (networkError.response?.status === 404) {
          return res.status(502).json({ 
            error: `Handshake failed: The branch node at ${pharmacy.name} is online but missing the /api/internal/verify-agent route.` 
          });
        }
        return res.status(502).json({ error: "Could not establish secure link with pharmacy database" });
      }
    }

    // Issue centralized tracking session token if verified successfully
    if (isVerified) {
      await logAgentLogin(agentNumber, verifiedAgentName, pharmacy.id, "AGENT_LOGGED_IN", `Agent logged in at ${pharmacy.name}`);

      const token = jwt.sign(
        { 
          role: "AGENT", 
          pharmacyId: pharmacy.id, 
          pharmacyName: pharmacy.name,
          agentName: verifiedAgentName,
          agentNumber,
        },
        JWT_SECRET,
        { expiresIn: "12h" }
      );

      return res.json({
        message: "Login successful",
        token,
        user: {
          role: "AGENT",
          pharmacyName: pharmacy.name,
          agentName: verifiedAgentName,
          agentNumber,
        }
      });
    }

    return res.status(401).json({ error: "Invalid Agent Number for this pharmacy branch" });

  } catch (error) {
    console.error("GLOBAL AGENT AUTH ERROR:", error);
    res.status(500).json({ error: "Internal authentication handler failed" });
  }
};

// 2. CENTRAL SYSTEM ADMINISTRATOR LOGIN
export const centralAdminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const admin = await prisma.centralAdmin.findUnique({
      where: { email }
    });

    if (!admin || admin.password !== password) {
      return res.status(401).json({ error: "Invalid central administrator credentials" });
    }

    const token = jwt.sign(
      { 
        role: "CENTRAL_ADMIN", 
        adminId: admin.id,
        email: admin.email
      },
      JWT_SECRET,
      { expiresIn: "4h" }
    );

    return res.json({
      message: "Admin verification successful",
      token,
      user: {
        role: "CENTRAL_ADMIN",
        email: admin.email
      }
    });

  } catch (error) {
    console.error("GLOBAL ADMIN AUTH ERROR:", error);
    res.status(500).json({ error: "Internal administrative authentication handler failed" });
  }
};