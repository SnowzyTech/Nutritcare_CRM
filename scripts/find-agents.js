const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const p = new PrismaClient();

async function main() {
  const email = "godsownlogistics@gmail.com";
  const newPassword = crypto.randomBytes(6).toString("base64url"); // e.g. "xK9m2Qp1"
  const hashed = await bcrypt.hash(newPassword, 12);

  await p.user.update({
    where: { email },
    data: { password: hashed },
  });

  console.log("\n=== Password Reset Successful ===\n");
  console.log(`Account: Gods Own Logistics`);
  console.log(`Email:   ${email}`);
  console.log(`New Password: ${newPassword}`);
  console.log("\n>>> Save this password — it cannot be retrieved again <<<\n");
}

main().finally(() => p.$disconnect());
