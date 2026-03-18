import { Request, Response } from 'express';
import { pool } from '../../db';

export const listDrugs = async (req: Request, res: Response) => {
  try {
    // ✅ Updated query with LEFT JOIN to get the AMO rate for each drug
    const { rows } = await pool.query(
      `SELECT
      d.id,
      d.name,
      d.dosage,
      d.form,
      d.selling_price,
      d.stock_quantity,
      a.reimbursement_rate as amo_rate
      FROM drugs d
      LEFT JOIN amo_drugs a ON d.id = a.drug_id
      WHERE d.stock_quantity > 0`
    );
    res.json(rows);
  } catch (error) {
    console.error("Error in listDrugs:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const getSuggestions = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query || query.length < 2) return res.json([]);

    const { rows } = await pool.query(
      `SELECT name FROM drugs WHERE name % $1
      ORDER BY similarity(name, $1) DESC LIMIT 10`,
                                      [query]
    );
    res.json(rows.map(r => r.name));
  } catch (error) {
    console.error("Error in getSuggestions:", error);
    res.status(500).json({ error: "Suggestion error" });
  }
};
