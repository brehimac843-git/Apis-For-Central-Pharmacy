import { Request, Response } from "express";
import axios from "axios";
import { prisma } from "../db";

// 💊 logic for aggregating stock from all pharmacies (Filtered by Drug Visibility rules)
export const aggregateStock = async (req: Request, res: Response) => {
  try {
    const drugName = req.params.drug as string;

    const pharmacies = await prisma.pharmacy.findMany();

    const results = await Promise.all(
      pharmacies.map(async (pharmacy) => {
        try {
          // 🔒 DECENTRALIZED RULE: Check if the drug is explicitly hidden via schema definition
          const visibilityBlock = await prisma.drugVisibility.findFirst({
            where: {
              pharmacyId: pharmacy.id,
              drugName: { equals: drugName, mode: "insensitive" },
              isHidden: true
            }
          });

          // If an admin turned on the hidden restriction for this drug at this pharmacy, skip it!
          if (visibilityBlock) {
            console.log(`🛡️ Guardrail: ${drugName} is hidden for ${pharmacy.name}`);
            return null;
          }

          const response = await axios.get(`${pharmacy.api_url}/api/public-stock`, { timeout: 1500 });
          const stock = response.data.find(
            (d: any) => d.name.toLowerCase() === drugName.toLowerCase()
          );

          if (!stock) return null;

          return {
            pharmacy: pharmacy.name,
            city: pharmacy.city,
            stock: stock.stock_quantity,
            price: parseFloat(stock.selling_price),
            amo_supported: pharmacy.amo_supported,
            latitude: parseFloat(pharmacy.latitude as any),
            longitude: parseFloat(pharmacy.longitude as any),
            amo_rate: stock.amo_rate 
          };
        } catch (error) {
          console.log(`Pharmacy ${pharmacy.name} unreachable or timed out`);
          return null;
        }
      })
    );

    const filtered = results.filter((r) => r !== null).sort((a: any, b: any) => a.price - b.price);
    res.json(filtered);
  } catch (error) {
    console.error("AGGREGATION ERROR:", error);
    res.status(500).json({ error: "Aggregation failed" });
  }
};

// 🎯 logic for merging suggestions from all pharmacies smoothly
export const getGlobalSuggestions = async (req: Request, res: Response) => {
  try {
    const rawQuery = req.query.q as string;
    if (!rawQuery) return res.json([]);

    const query = rawQuery.trim();
    if (query.length < 1) return res.json([]);

    const pharmacies = await prisma.pharmacy.findMany();

    const responses = await Promise.all(
      pharmacies.map(async (pharmacy) => {
        try {
          const response = await axios.get(
            `${pharmacy.api_url}/api/suggestions?q=${encodeURIComponent(query)}`,
            { timeout: 1000 }
          );
          
          const suggestions = response.data as string[];

          // 🔒 DECENTRALIZED RULE: Find all blacklisted/hidden drug rules for this pharmacy node
          const hiddenRules = await prisma.drugVisibility.findMany({
            where: {
              pharmacyId: pharmacy.id,
              isHidden: true
            },
            select: { drugName: true }
          });

          const hiddenSet = new Set(hiddenRules.map(r => r.drugName.toLowerCase()));
          
          // Only return suggestions that aren't blacklisted for this pharmacy
          return suggestions.filter(item => !hiddenSet.has(item.toLowerCase()));

        } catch (axiosError) {
          console.error(`Could not fetch suggestions from ${pharmacy.name} or request timed out`);
          return [];
        }
      })
    );

    const merged = [...new Set(responses.flat())];
    res.json(merged.slice(0, 10));
  } catch (error) {
    console.error("SUGGESTION ERROR:", error);
    res.status(500).json({ error: "Suggestions failed" });
  }
};

// 📋 logic for the full catalogue with pagination and auto-categorization
export const getCatalogue = async (req: Request, res: Response) => {
  try {
    const DRUG_CATEGORIES: Record<string, string> = {
      "artemether": "Anti-paludique",
      "lumefantrine": "Anti-paludique",
      "amoxicillin": "Antibiotique",
      "paracetamol": "Antalgique / Antipyrétique",
      "ibuprofen": "Anti-inflammatoire",
      "metformin": "Antidabétique",
      "omeprazole": "Gastro-entérologie",
      "cetirizine": "Antihistaminique",
    };

    const assignCategory = (drugName: string) => {
      const lowerName = drugName.toLowerCase();
      for (const [keyword, category] of Object.entries(DRUG_CATEGORIES)) {
        if (lowerName.includes(keyword)) return category;
      }
      return "Autres (Général)";
    };

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const pharmacies = await prisma.pharmacy.findMany();

    const results = await Promise.all(
      pharmacies.map(async (pharmacy) => {
        try {
          // 🔒 DECENTRALIZED RULE: Gather hidden drug constraints to clean catalogue feeds on the fly
          const hiddenRules = await prisma.drugVisibility.findMany({
            where: {
              pharmacyId: pharmacy.id,
              isHidden: true
            },
            select: { drugName: true }
          });
          const hiddenSet = new Set(hiddenRules.map(r => r.drugName.toLowerCase()));

          const response = await axios.get(`${pharmacy.api_url}/api/public-stock`, { timeout: 1500 });
          const rawStock = response.data as any[];

          // Strip restricted drugs out of the catalog arrays
          return rawStock.filter((item: any) => !hiddenSet.has(item.name.trim().toLowerCase()));

        } catch (error) {
          console.error(`Catalogue: Pharmacy ${pharmacy.name} unreachable or timed out`);
          return [];
        }
      })
    );

    const allStock = results.flat();
    const catalogueMap = new Map();
    
    allStock.forEach((item: any) => {
      const displayKey = item.name.trim(); 
      const mapKey = displayKey.toLowerCase(); 
      const price = parseFloat(item.selling_price);

      if (!catalogueMap.has(mapKey)) {
        catalogueMap.set(mapKey, {
          name: displayKey,
          category: assignCategory(displayKey),
          minPrice: price,
          availableAt: 1,
        });
      } else {
        const existing = catalogueMap.get(mapKey);
        existing.availableAt += 1;
        if (price < existing.minPrice) {
          existing.minPrice = price;
        }
      }
    });

    const formattedCatalogue = Array.from(catalogueMap.values());
    
    formattedCatalogue.sort((a, b) => {
      if (a.category === b.category) {
        return a.name.localeCompare(b.name);
      }
      return a.category.localeCompare(b.category);
    });

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedResults = formattedCatalogue.slice(startIndex, endIndex);

    res.json({
      totalItems: formattedCatalogue.length,
      totalPages: Math.ceil(formattedCatalogue.length / limit),
      currentPage: page,
      data: paginatedResults
    });

  } catch (error) {
    console.error("CATALOGUE ERROR:", error);
    res.status(500).json({ error: "Failed to load catalogue" });
  }
};