import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const LOG_FILE = 'server_error.log';
const originalError = console.error;
console.error = (...args) => {
  fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${args.join(' ')}\n`);
  originalError.apply(console, args);
};

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import debtRoutes from './routes/debt.routes.js';
import debtGoalRoutes from './routes/debt-goal.routes.js';
import investmentRoutes from './routes/investment.routes.js';
import marketRoutes from './routes/market.routes.js';
import agenticRoutes from './routes/agentic.routes.js';
import reportRoutes from './routes/report.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import articleRoutes from './routes/article.routes.js';
import cronManager from './cron/index.js';
import { initSocket } from './utils/socket.js';

const app = express();
const server = createServer(app);
const io = initSocket(server);

const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow any localhost port in development
    if (origin.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/)) {
      return callback(null, true);
    }
    // Allow configured client URL
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    if (origin === clientUrl) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json()); // No more Base64 images, back to default text payload

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/debts/goal', debtGoalRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/investment', investmentRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/agentic', agenticRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/articles', articleRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

server.listen(PORT, () => {
  console.log(`🚀 FinSight API running at http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔌 Socket.io initialized`);

  // Initialize background jobs
  cronManager.init();
});

export default app;
