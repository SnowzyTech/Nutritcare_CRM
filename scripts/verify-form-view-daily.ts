/**
 * scripts/verify-form-view-daily.ts  (READ-ONLY)
 *
 * Confirms the Prisma `FormViewDaily` model binds to the real table after the
 * raw-SQL migration: runs the exact groupBy the admin/media-buyer screens use.
 * If columns/types were wrong this throws — catching it before a deploy.
 *
 *   node --import tsx scripts/verify-form-view-daily.ts
 */
import { readFileSync } from "node:fs";
import dns from "node:dns";

try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch {
  /* ignore */
}

function loadEnv() {
  const raw = readFileSync(".env", "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[m[1]] = val;
  }
}

async function main() {
  loadEnv();
  const host = (process.env.DATABASE_URL ?? "").match(/@([^/]+)/)?.[1] ?? "unknown";
  console.log(`Target DB host: ${host}\n`);

  const { prisma } = await import("@/lib/db/prisma");
  try {
    const sums = await prisma.formViewDaily.groupBy({
      by: ["formId"],
      _sum: { count: true },
    });
    const total = sums.reduce((s, r) => s + (r._sum.count ?? 0), 0);
    console.log(`Prisma read OK: ${sums.length} forms, ${total} total views.`);

    const top = [...sums]
      .sort((a, b) => (b._sum.count ?? 0) - (a._sum.count ?? 0))
      .slice(0, 5);
    for (const r of top) {
      const form = await prisma.form.findUnique({
        where: { id: r.formId },
        select: { name: true, hits: true },
      });
      console.log(
        `  ${form?.name ?? r.formId}: daily-tally=${r._sum.count ?? 0}  (legacy Form.hits=${form?.hits ?? "?"})`
      );
    }
    console.log("\nModel <-> table binding verified.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
