import { Router } from "express";
import { aggregateStock, getGlobalSuggestions } from "../controller/searchController";

const router = Router();

// Map the paths to the controller functions
router.get("/aggregate-stock/:drug", aggregateStock);
router.get("/suggestions", getGlobalSuggestions);

export default router;
