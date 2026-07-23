import { Request, Response } from 'express';
import { prisma } from '../db/index.js';

export const listDrugs = async (req: Request, res: Response) => {
  try {
    const drugs = await prisma.drug.findMany({
      where: {
        stock_quantity: { gt: 0 }
      },
      include: {
        amoDrug: true 
      }
    });

    const formattedRows = drugs.map((d: any) => ({
      id: d.id,
      name: d.name,
      dosage: d.dosage,
      form: d.form,
      selling_price: parseFloat(d.selling_price),
      stock_quantity: d.stock_quantity,
      amo_rate: d.amoDrug ? d.amoDrug.reimbursement_rate : null
    }));

    res.json(formattedRows);
  } catch (error) {
    console.error("Error in listDrugs:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const getSuggestions = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query || query.length < 1) return res.json([]);

    let rows;
    if (query.length < 4) {
      // ⚡ For 1-2 characters, use a lightning-fast left-anchored match
      rows = await prisma.$queryRaw<{ name: string }[]>`
        SELECT DISTINCT name FROM drugs 
        WHERE name ILIKE ${query + '%'}
        LIMIT 10
      `;
    } else {
      // 🎯 For 3+ characters, use your advanced similarity matching
      rows = await prisma.$queryRaw<{ name: string }[]>`
        SELECT name FROM drugs 
        WHERE name % ${query}
        ORDER BY similarity(name, ${query}) DESC 
        LIMIT 10
      `;
    }

    res.json(rows.map((r: { name: string }) => r.name));
  } catch (error) {
    console.error("Error in getSuggestions:", error);
    res.status(500).json({ error: "Suggestion error" });
  }
};