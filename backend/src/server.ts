import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { registerRoutes } from './routes.loader.js';
import { initWebSocket } from './core/websocket.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PeoplePay360 Backend API',
    timestamp: new Date().toISOString(),
  });
});

// Register feature routes
registerRoutes(app);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[ServerError]', err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred.',
    },
  });
});

// Create HTTP server & attach WebSocket engine
const server = http.createServer(app);
initWebSocket(server);

server.listen(PORT, () => {
  console.log(`🚀 PeoplePay360 Backend API running on http://localhost:${PORT}`);
  console.log(`⚡ PeoplePay360 WebSocket running on ws://localhost:${PORT}/ws`);
});
