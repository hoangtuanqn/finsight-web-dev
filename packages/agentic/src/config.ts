let dbClient: any = null;
let marketSvc: any = null;

export function initAgentic(prismaClient: any, marketService?: any) {
  dbClient = prismaClient;
  marketSvc = marketService;
}

export function getDb() {
  if (!dbClient) {
    throw new Error(
      'Database client for agentic package has not been initialized. Please call initAgentic(prisma) first.',
    );
  }
  return dbClient;
}

export function getMarketService() {
  if (!marketSvc) {
    throw new Error('Market service not initialized. Please pass it to initAgentic(prisma, marketService).');
  }
  return marketSvc;
}
