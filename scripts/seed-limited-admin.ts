import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Provision a limited ADMIN account. Credentials come from the environment.
 * A SUPER_ADMIN can then revoke individual page access from
 * /admin/staff/admins.
 *
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... npx tsx scripts/seed-limited-admin.ts
 */
async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      "Missing ADMIN_EMAIL and/or ADMIN_PASSWORD environment variables."
    );
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  console.log(`Creating limited admin user: ${email}...`);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: process.env.ADMIN_NAME ?? "Admin",
      password: hashedPassword,
      role: "ADMIN",
      accountActivationStatus: "APPROVED",
    },
    create: {
      name: process.env.ADMIN_NAME ?? "Admin",
      email,
      password: hashedPassword,
      role: "ADMIN",
      accountActivationStatus: "APPROVED",
    },
  });

  console.log("Limited admin created/updated successfully:");
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
