import { Request, Response } from "express";
import { prisma } from "../db/index";

export const verifyLocalAgent = async (req: Request, res: Response) => {
  try {
    const { agentNumber } = req.body;

    if (!agentNumber) {
      return res.status(400).json({ verified: false, error: "Agent number is required" });
    }

    const agent = await prisma.agent.findUnique({
      where: { agent_number: agentNumber },
    });

    if (!agent) {
      return res.status(404).json({ verified: false, error: "Agent not found in this pharmacy branch" });
    }

    return res.json({
      verified: true,
      agentName: agent.agent_name,
      agentNumber: agent.agent_number,
    });
  } catch (error) {
    console.error("LOCAL AGENT VERIFICATION ERROR:", error);
    return res.status(500).json({ verified: false, error: "Internal pharmacy auth error" });
  }
};

export const createLocalAgent = async (req: Request, res: Response) => {
  try {
    const { agentNumber, agentName } = req.body;

    if (!agentNumber || !agentName) {
      return res.status(400).json({ error: "agentNumber and agentName are required" });
    }

    const agent = await prisma.agent.create({
      data: {
        agent_number: String(agentNumber),
        agent_name: String(agentName),
      },
    });

    return res.status(201).json({
      id: agent.id,
      agentNumber: agent.agent_number,
      agentName: agent.agent_name,
    });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return res.status(409).json({ error: "Agent number already exists on this branch" });
    }
    console.error("CREATE LOCAL AGENT ERROR:", error);
    return res.status(500).json({ error: "Failed to create branch agent" });
  }
};

export const updateLocalAgent = async (req: Request, res: Response) => {
  try {
    const agentNumber = String(req.params.agentNumber);
    const { agentName, isActive } = req.body;

    const existing = await prisma.agent.findUnique({ where: { agent_number: agentNumber } });
    if (!existing) {
      return res.status(404).json({ error: "Agent not found on this branch" });
    }

    if (isActive === false) {
      await prisma.agent.delete({ where: { agent_number: agentNumber } });
      return res.json({ deleted: true, agentNumber });
    }

    const updated = await prisma.agent.update({
      where: { agent_number: agentNumber },
      data: {
        agent_name: agentName !== undefined ? String(agentName) : undefined,
      },
    });

    return res.json({
      id: updated.id,
      agentNumber: updated.agent_number,
      agentName: updated.agent_name,
    });
  } catch (error) {
    console.error("UPDATE LOCAL AGENT ERROR:", error);
    return res.status(500).json({ error: "Failed to update branch agent" });
  }
};

export const deleteLocalAgent = async (req: Request, res: Response) => {
  try {
    const agentNumber = String(req.params.agentNumber);

    const existing = await prisma.agent.findUnique({ where: { agent_number: agentNumber } });
    if (!existing) {
      return res.status(404).json({ error: "Agent not found on this branch" });
    }

    await prisma.agent.delete({ where: { agent_number: agentNumber } });
    return res.json({ deleted: true, agentNumber });
  } catch (error) {
    console.error("DELETE LOCAL AGENT ERROR:", error);
    return res.status(500).json({ error: "Failed to delete branch agent" });
  }
};
