import { Request, Response } from 'express';
import { pool } from '../../db'; // Path to your db file

export const listDrugs = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, dosage, form, selling_price, stock_quantity
      FROM drugs WHERE stock_quantity > 0`
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
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
    res.status(500).json({ error: "Suggestion error" });
  }
};
