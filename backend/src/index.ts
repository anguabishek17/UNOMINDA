import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load Env variables
dotenv.config();

import authRoutes from './routes/auth';
import machineRoutes from './routes/machines';
import lineRoutes from './routes/lines';
import instructionRoutes from './routes/instructions';
import reportRoutes from './routes/reports';
import analyticsRoutes from './routes/analytics';
import aiRoutes from './routes/ai';
import acknowledgementRoutes from './routes/acknowledgements';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow frontend access
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve file uploads statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes mapping
app.use('/api/auth', authRoutes);
app.use('/api/machines', machineRoutes);
app.use('/api/lines', lineRoutes);
app.use('/api/instructions', instructionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/acknowledgements', acknowledgementRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`[UNO MINDA BACKEND] running on port ${PORT}`);
});
