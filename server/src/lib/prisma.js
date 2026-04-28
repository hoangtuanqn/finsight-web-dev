import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient().$extends({
  query: {
    debt: {
      async findMany({ args, query }) {
        if (!args.includeDeleted) {
          args.where = { ...args.where, deletedAt: null };
        }
        delete args.includeDeleted;
        return query(args);
      },
      async findFirst({ args, query }) {
        if (!args.includeDeleted) {
          args.where = { ...args.where, deletedAt: null };
        }
        delete args.includeDeleted;
        return query(args);
      },
      async count({ args, query }) {
        if (!args.includeDeleted) {
          args.where = { ...args.where, deletedAt: null };
        }
        delete args.includeDeleted;
        return query(args);
      }
    }
  }
});

export default prisma;
