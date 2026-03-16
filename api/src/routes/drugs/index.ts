import { Router } from 'express';
//import dotenv from "dotenv";
//import {Pool} from "pg";

//dotenv.config();


const router = Router();

/*const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
                      user: process.env.DB_USER,
                      password: process.env.DB_PASSWORD,
                      database: process.env.DB_NAME
});*/

router.get('/', (req, res) => {
    res.send('hello world 123 ')
});
/*router.get('/drugs', (req, res) => {
   try {
    const { rows } = await pool.query(
      `SELECT
      id,
      name,
      dosage,
      form,
        selling_price,
        stock_quantity
        FROM drugs
        WHERE stock_quantity > 0`
    );

    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
})*/

export default router;