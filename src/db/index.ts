import { PrismaNeon } from "@prisma/adapter-neon";
import { Prisma, PrismaClient } from "../generated/prisma/client";

// A placeholder keeps `next build` working before DATABASE_URL is configured;
// queries will fail at runtime until a real connection string is provided.
const url =
  process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("ep-xxx")
    ? process.env.DATABASE_URL
    : "postgresql://user:password@localhost.invalid/meow";

function createClient() {
  return new PrismaClient({ adapter: new PrismaNeon({ connectionString: url }) });
}

// Reuse one client across hot reloads in dev so we don't exhaust connections.
const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createClient> };
export const db = globalForPrisma.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export { Prisma };

/** True when a write failed because of a unique-constraint violation (Postgres 23505 / Prisma P2002). */
export function isUniqueViolation(err: unknown) {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}
