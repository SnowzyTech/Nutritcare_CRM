import { PrismaClient } from "@prisma/client";
import { createAuditCamera } from "@/lib/audit/camera";

const globalForPrisma = globalThis as unknown as {
  basePrisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL ?? "";

  // Neon serverless adapter is only compatible with Neon cloud databases.
  // Local PostgreSQL connections use the standard driver.
  if (connectionString.includes("neon.tech")) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pool, neonConfig } = require("@neondatabase/serverless");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaNeon } = require("@prisma/adapter-neon");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    neonConfig.webSocketConstructor = require("ws");
    // In a long-lived dev/server process the Neon WebSocket pool can hold a
    // connection that Neon (or a proxy/firewall) has silently dropped. Without
    // these limits the next query waits on the dead socket for ~tens of seconds
    // before failing. Pruning idle clients and capping connect time makes a
    // stale connection fail fast (and get replaced) instead of hanging.
    const pool = new Pool({
      connectionString,
      idleTimeoutMillis: 30_000, // close idle clients before Neon does
      connectionTimeoutMillis: 10_000, // error fast if a new connection stalls
      max: 10,
    });
    const adapter = new PrismaNeon(pool);
    return new PrismaClient({ adapter } as never);
  }

  return new PrismaClient();
}

/**
 * The un-extended client. Private to this module + the audit layer: the audit
 * "camera" writes rows through this so its own inserts never re-trigger the
 * camera (recursion-safe). Everything else in the app uses `prisma` below.
 */
export const basePrisma = globalForPrisma.basePrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.basePrisma = basePrisma;
}

/**
 * The application client: the base client + the audit camera extension, which
 * auto-logs every create/update/delete to `audit_logs`. All app code should
 * import THIS.
 *
 * The camera only adds a query interceptor — it exposes the exact same models
 * and operations as the base client — so we present it with the plain
 * `PrismaClient` type. This keeps the runtime extension while avoiding the
 * "excessive stack depth" type blow-ups that `$extends` triggers in code using
 * `Prisma.*Args` generics against a large schema.
 */
export const prisma: PrismaClient = basePrisma.$extends(
  createAuditCamera(basePrisma)
) as unknown as PrismaClient;
