import { Request, Response } from "express";
import axios from "axios";
import { pool } from "../db";

// logic for aggregating stock from all pharmacies
export const aggregateStock = async (req: Request, res: Response) => {
  try {
    const drugName = req.params.drug as String;
    const { rows: pharmacies } = await pool.query("SELECT * FROM pharmacies");

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
            price: price: parseFloat(stock.selling_price),
            amo_supported: pharmacy.amo_supported,
            latitude: parseFloat(pharmacy.latitude),
            longitude: parseFloat(pharmacy.longitude)
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
    res.status(500).json({ error: "Aggregation failed" });
  }
};

// logic for merging suggestions from all pharmacies
export const getGlobalSuggestions = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query || query.length < 2) return res.json([]);

    const { rows: pharmacies } = await pool.query("SELECT * FROM pharmacies");

    const responses = await Promise.all(
      pharmacies.map(async (pharmacy) => {
        try {
          const response = await axios.get(`${pharmacy.api_url}/api/suggestions?q=${query}`);
          return response.data;
        } catch {
          return [];
        }
      })
    );

    const merged = [...new Set(responses.flat())];
    res.json(merged.slice(0, 10));
  } catch (error) {
    res.status(500).json({ error: "Suggestions failed" });
  }
};
