import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";
import { Pool, type PoolConfig } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

/**
 * Resolves the Postgres URL used by `pg` for connection pooling.
 * `prisma+postgres://` (Prisma dev) is not understood by `pg`; set `PG_CONNECTION_URL`
 * to the underlying `postgresql://` connection string in that case.
 */
function resolvePooledConnectionString(): string {
  const pgUrl = process.env.PG_CONNECTION_URL;
  const dbUrl = process.env.DATABASE_URL;

  if (pgUrl?.startsWith("postgresql://") || pgUrl?.startsWith("postgres://")) {
    return pgUrl;
  }

  if (dbUrl?.startsWith("postgresql://") || dbUrl?.startsWith("postgres://")) {
    return dbUrl;
  }

  console.error("Connection strings found:", { 
    DATABASE_URL: dbUrl ? "SET" : "NOT SET", 
    PG_CONNECTION_URL: pgUrl ? "SET" : "NOT SET" 
  });

  throw new Error(
    "Set PG_CONNECTION_URL or DATABASE_URL to a valid postgresql:// URL."
  );
}

function createPool(): Pool {
  const connectionString = resolvePooledConnectionString();
  const config: PoolConfig = {
    connectionString,
    max: Number(process.env.PG_POOL_MAX ?? 10),
    idleTimeoutMillis: Number(process.env.PG_POOL_IDLE_MS ?? 30_000),
    connectionTimeoutMillis: Number(process.env.PG_POOL_CONNECT_TIMEOUT_MS ?? 10_000),
  };
  return new Pool(config);
}

function createPrismaClient(): PrismaClient {
  const pool = globalForPrisma.pgPool ?? createPool();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pgPool = pool;
  }

  const adapter = new PrismaPg(pool, { disposeExternalPool: false });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function disconnectDb(): Promise<void> {
  await prisma.$disconnect();
  await globalForPrisma.pgPool?.end();
  globalForPrisma.pgPool = undefined;
  globalForPrisma.prisma = undefined;
}
