import { Request, Response } from "express";
import axios from "axios";
import { prisma } from "../db";

// logic for aggregating stock from all pharmacies
export const aggregateStock = async (req: Request, res: Response) => {
  try {
    const drugName = req.params.drug as string;

    // This now uses your custom adapter via the imported `prisma` instance!
    const pharmacies = await prisma.pharmacy.findMany();

    const results = await Promise.all(
      pharmacies.map(async (pharmacy) => {
        try {
          const response = await axios.get(`${pharmacy.api_url}/api/public-stock`);
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
                     longitude: parseFloat(pharmacy.longitude as any)
          };
        } catch {
          console.log(`Pharmacy ${pharmacy.name} unreachable`);
          return null;
        }
      })
    );

    const filtered = results.filter((r) => r !== null).sort((a: any, b: any) => a.price - b.price);
    res.json(filtered);
  } catch (error) {
    console.error("AGGREGATION ERROR:", error); // <-- Added this!
    res.status(500).json({ error: "Aggregation failed" });
  }
};

// logic for merging suggestions from all pharmacies
export const getGlobalSuggestions = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query || query.length < 2) return res.json([]);

    // This also now uses your custom adapter!
    const pharmacies = await prisma.pharmacy.findMany();

    const responses = await Promise.all(
      pharmacies.map(async (pharmacy) => {
        try {
          const response = await axios.get(`${pharmacy.api_url}/api/suggestions?q=${query}`);
          return response.data;
        } catch (axiosError) {
          console.error(`Could not fetch from ${pharmacy.api_url}`);
          return [];
        }
      })
    );

    const merged = [...new Set(responses.flat())];
    res.json(merged.slice(0, 10));
  } catch (error) {
    console.error("SUGGESTION ERROR:", error); // <-- Added this!
    res.status(500).json({ error: "Suggestions failed" });
  }
};
