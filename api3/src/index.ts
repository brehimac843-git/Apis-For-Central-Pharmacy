import express, { json } from 'express';
import cors from 'cors';
import drugsRoutes from './routes/drugs/index';

const app = express();
const port = process.env.PORT || 3003;

app.use(cors());
app.use(json());

// This makes all routes inside drugsRoutes prefixed with /api
app.use('/api', drugsRoutes);

app.listen(port, () => {
    console.log(`Pharmacy API running on port ${port}`);
});
