import { initAgentic } from '@repo/agentic';
import { server } from './app';
import cronManager from './cron/index';
import prisma from './lib/prisma';
import * as marketService from './services/market.service';

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`🚀 FinSight API running at http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔌 Socket.io initialized`);

  // Initialize background jobs
  (cronManager as any).init();

  // Initialize Agentic DB Client
  initAgentic(prisma, marketService);
});
