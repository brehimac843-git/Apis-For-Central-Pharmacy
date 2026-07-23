import { Response } from "express";
import { prisma } from "../db.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";

/**
 * 🛡️ Manage whether a specific drug is visible at a specific pharmacy node
 * Expects payload: { pharmacyId: number, drugName: string, isVisible: boolean }
 */
export const toggleDrugVisibility = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { pharmacyId, drugName, isVisible } = req.body;

    // 1. Structural Validation
    if (pharmacyId === undefined || !drugName || isVisible === undefined) {
      return res.status(400).json({ error: "pharmacyId, drugName, and isVisible state are required" });
    }

    const parsedPharmacyId = Number(pharmacyId);
    if (isNaN(parsedPharmacyId)) {
      return res.status(400).json({ error: "Invalid pharmacyId structure format" });
    }

    // 2. Multi-Tenant Boundary Security
    // Prevent standard branch agents from altering records belonging to foreign nodes
    if (req.user?.role === "AGENT" && req.user.pharmacyId !== parsedPharmacyId) {
      return res.status(403).json({ 
        error: "Access denied. Agents can only manage visibility parameters for their assigned branch." 
      });
    }

    // Mapping conversion logic: if visible is true -> isHidden must become false
    const targetHiddenState = !Boolean(isVisible);
    const normalizedDrugName = drugName.trim();

    // 3. Confirm target pharmacy registration inside core registry
    const pharmacyExists = await prisma.pharmacy.findUnique({
      where: { id: parsedPharmacyId }
    });

    if (!pharmacyExists) {
      return res.status(404).json({ error: "Target pharmacy node not registered in system aggregator" });
    }

    // 4. Determine existence of visibility override rule entry
    const existingRule = await prisma.drugVisibility.findFirst({
      where: {
        pharmacyId: parsedPharmacyId,
        drugName: { equals: normalizedDrugName, mode: "insensitive" }
      }
    });

    if (existingRule) {
      // Rule exists -> Update toggle properties
      const updatedRule = await prisma.drugVisibility.update({
        where: { id: existingRule.id },
        data: { isHidden: targetHiddenState }
      });

      return res.json({
        message: `Visibility restriction modified for ${normalizedDrugName}`,
        rule: updatedRule
      });
    } else {
      // Rule does not exist -> Generate new entry
      const newRule = await prisma.drugVisibility.create({
        data: {
          pharmacyId: parsedPharmacyId,
          drugName: normalizedDrugName,
          isHidden: targetHiddenState
        }
      });

      return res.status(201).json({
        message: `New visibility block rule generated for ${normalizedDrugName}`,
        rule: newRule
      });
    }

  } catch (error) {
    console.error("VISIBILITY TOGGLE SYSTEM ERROR:", error);
    res.status(500).json({ error: "Internal server error updating visibility configurations" });
  }
};