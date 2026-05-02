import cors from 'cors';
import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import { createServer } from 'http';

const LOG_FILE = 'server_error.log';
const originalError = console.error;
console.error = (...args: any[]) => {
  fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${args.join(' ')}\n`);
  originalError.apply(console, args);
};

import agenticRoutes from './routes/agentic.routes';
import articleRoutes from './routes/article.routes';
import authRoutes from './routes/auth.routes';
import bankSyncRoutes from './routes/bank-sync.routes';
import debtGoalRoutes from './routes/debt-goal.routes';
import debtRoutes from './routes/debt.routes';
import expenseRoutes from './routes/expense.routes';
import investmentRoutes from './routes/investment.routes';
import kycRoutes from './routes/kyc.routes';
import marketRoutes from './routes/market.routes';
import referralRoutes from './routes/referral.routes';
import repaymentPlanRoutes from './routes/repayment-plan.routes';
import reportRoutes from './routes/report.routes';
import subscriptionRoutes from './routes/subscription.routes';
import userRoutes from './routes/user.routes';
import walletRoutes from './routes/wallet.routes';
import { initSocket } from './utils/socket';

const app = express();
const server = createServer(app);
const io = initSocket(server);

const PORT = process.env.PORT || 5001;

// Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (origin.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/)) {
        return callback(null, true);
      }
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      if (origin === clientUrl) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }),
);
app.use(express.json());

// Set COOP header for social login popups
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});

// Routes
app.use('/api/expenses', expenseRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/debts/goal', debtGoalRoutes);
app.use('/api/repayment-plans', repaymentPlanRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/investment', investmentRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/agentic', agenticRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/bank-sync', bankSyncRoutes);
app.use('/api/referral', referralRoutes);
app.use('/api/kyc', kycRoutes);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

export { app, server };
export default app;
