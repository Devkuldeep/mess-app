import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function create() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    // Optional cap, e.g. 1 for `prisma dev` (single-connection local Postgres).
    max: Number(process.env.DATABASE_POOL_MAX) || undefined,
  });
  return new PrismaClient({ adapter });
}

// Reuse one client across hot reloads in dev.
export const db = globalForPrisma.prisma ?? create();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
