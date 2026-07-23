import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import searchRoutes from "./routes/search.js";
import publicRoutes from "./routes/publicRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

// Routes
app.use("/api", searchRoutes);
app.use("/api", publicRoutes);

// 🌟 Fix: Store the fallback so the console log never lies to you
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Central platform running on port ${PORT}`);
});