import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import searchRoutes from "./routes/search";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api", searchRoutes);

app.listen(process.env.PORT || 3000, () => {
  console.log(`Central platform running on port ${process.env.PORT}`);
});
