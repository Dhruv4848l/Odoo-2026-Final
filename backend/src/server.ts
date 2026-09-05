import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { loadRoutes } from './routes.loader';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Auto-load API routes
loadRoutes(app);

app.listen(PORT, () => {
  console.log(`[PeoplePay360] Backend server running on http://localhost:${PORT}`);
});
