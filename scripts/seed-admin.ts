import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Neon serverless (WebSocket) adapter when pointing at a Neon DB — the plain
// client can't reach Neon's pooler endpoint. Mirrors lib/db/prisma.ts.
function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "";
  if (url.includes("neon.tech")) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pool, neonConfig } = require("@neondatabase/serverless");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaNeon } = require("@prisma/adapter-neon");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    neonConfig.webSocketConstructor = require("ws");
    const pool = new Pool({ connectionString: url });
    return new PrismaClient({ adapter: new PrismaNeon(pool) } as never);
  }
  return new PrismaClient();
}

const prisma = createClient();

/**
 * Bootstrap the SUPER_ADMIN (root) account. Credentials come from the
 * environment — never hardcode them here.
 *
 *   SUPERADMIN_EMAIL=... SUPERADMIN_PASSWORD=... npx tsx scripts/seed-admin.ts
 */
async function main() {
  const adminEmail = process.env.SUPERADMIN_EMAIL;
  const adminPassword = process.env.SUPERADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error(
      "Missing SUPERADMIN_EMAIL and/or SUPERADMIN_PASSWORD environment variables."
    );
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  console.log(`Creating super admin user: ${adminEmail}...`);

  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Super Admin",
      password: hashedPassword,
      role: "SUPER_ADMIN",
      accountActivationStatus: "APPROVED",
    },
    create: {
      name: "Super Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "SUPER_ADMIN",
      accountActivationStatus: "APPROVED",
    },
  });

  console.log("Super admin created/updated successfully:");
  console.log(`ID: ${user.id}`);
  console.log(`Email: ${user.email}`);
  console.log(`Role: ${user.role}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
