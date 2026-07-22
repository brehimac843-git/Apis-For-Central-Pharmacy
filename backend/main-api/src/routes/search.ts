import { Router } from "express";
import { aggregateStock, getCatalogue, getGlobalSuggestions } from "../controllers/searchController";
import { toggleDrugVisibility } from "../controllers/visibilityController";
import { agentLogin, centralAdminLogin } from "../controllers/AgentController";
import {
  requireAuth,
  requireCentralAdmin,
} from "../middleware/authMiddleware";
import {
  listPharmacies,
  createPharmacy,
  updatePharmacy,
  deletePharmacy,
  listAgents,
  createAgent,
  updateAgent,
  deleteAgent,
  listActivityLogs,
  getPharmacyStock,
  listPublicUsers,
  createPublicUser,
  updatePublicUser,
  deletePublicUser,
} from "../controllers/adminController";
import { prisma } from "../db";

const router = Router();

// 🔓 Public Aggregator & Search Access
router.get("/aggregate-stock/:drug", aggregateStock);
router.get("/catalogue", getCatalogue);
router.get("/suggestions", getGlobalSuggestions);

// 🔓 Authentication Endpoints
router.post("/auth/agent-login", agentLogin);
router.post("/auth/admin-login", centralAdminLogin);

// 🔓 Pharmacy Branch Discovery (Used by your Agent Login Dropdown)
router.get("/pharmacies", async (req, res) => {
    try {
        const list = await prisma.pharmacy.findMany({
            select: {
                id: true,
                name: true,
                city: true,
                latitude: true,
                longitude: true,
                amo_supported: true,
            },
        });
        res.json(list.map((pharmacy) => ({
            id: pharmacy.id,
            name: pharmacy.name,
            city: pharmacy.city,
            latitude: parseFloat(pharmacy.latitude as any),
            longitude: parseFloat(pharmacy.longitude as any),
            amo_supported: pharmacy.amo_supported,
        })));
    } catch (err) {
        res.status(500).json({ error: "Failed to pull registry nodes" });
    }
});

// 🛡️ Protected Dashboard Layout Data (Requires a valid agent session)
router.get("/visibility/:pharmacyId", requireAuth, async (req: any, res) => {
    try {
        const targetId = parseInt(req.params.pharmacyId);

        // Guardrail: Ensure an Agent can't spy on a different pharmacy branch data list
        if (req.user.role === "AGENT" && req.user.pharmacyId !== targetId) {
            return res.status(403).json({ error: "Access denied to foreign node boundaries." });
        }

        const hiddenRecords = await prisma.drugVisibility.findMany({
            where: { pharmacyId: targetId, isHidden: true },
            select: { id: true, drugName: true }
        });

        // Remap data into a simple array of strings/IDs that the frontend dashboard handles gracefully
        // Using IDs or remapping to names to fit your frontend state matching
        const dummyIds = hiddenRecords.map((r, index) => index + 1); // Fallback mock or actual rule IDs
        res.json({ hiddenIds: dummyIds, records: hiddenRecords });
    } catch (err) {
        res.status(500).json({ error: "Failed to read node configurations" });
    }
});

// 🛡️ Hybrid Visibility Toggle (Accessible by Central Admins OR verified Branch Agents)
router.post("/visibility/toggle", requireAuth, toggleDrugVisibility);

// 🏥 Central Admin Management
router.get("/admin/pharmacies", requireAuth, requireCentralAdmin, listPharmacies);
router.post("/admin/pharmacies", requireAuth, requireCentralAdmin, createPharmacy);
router.put("/admin/pharmacies/:id", requireAuth, requireCentralAdmin, updatePharmacy);
router.delete("/admin/pharmacies/:id", requireAuth, requireCentralAdmin, deletePharmacy);

router.get("/admin/agents", requireAuth, requireCentralAdmin, listAgents);
router.post("/admin/agents", requireAuth, requireCentralAdmin, createAgent);
router.put("/admin/agents/:id", requireAuth, requireCentralAdmin, updateAgent);
router.delete("/admin/agents/:id", requireAuth, requireCentralAdmin, deleteAgent);

router.get("/admin/users", requireAuth, requireCentralAdmin, listPublicUsers);
router.post("/admin/users", requireAuth, requireCentralAdmin, createPublicUser);
router.put("/admin/users/:id", requireAuth, requireCentralAdmin, updatePublicUser);
router.delete("/admin/users/:id", requireAuth, requireCentralAdmin, deletePublicUser);

router.get("/admin/activity-logs", requireAuth, requireCentralAdmin, listActivityLogs);
router.get("/admin/stock/:id", requireAuth, requireCentralAdmin, getPharmacyStock);

export default router;
