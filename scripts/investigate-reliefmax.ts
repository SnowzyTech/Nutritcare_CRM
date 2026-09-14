/**
 * scripts/investigate-reliefmax.ts
 *
 * READ-ONLY. Investigates why "reliefmax" orders reported by customers are not
 * showing in the CRM. Prints the target DB host first and only ever SELECTs.
 *
 *   node --import tsx scripts/investigate-reliefmax.ts
 */
import { readFileSync } from "node:fs";

function loadEnv() {
  const raw = readFileSync(".env", "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let val = m[2];
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[m[1]] = val;
  }
}

type FormRow = { id: string; name: string; disabledAt: Date | null; deletedAt: Date | null };

async function main() {
  loadEnv();
  const host = (process.env.DATABASE_URL ?? "").match(/@([^/]+)/)?.[1] ?? "unknown";
  console.log(`Target DB host: ${host}\n`);

  const { prisma } = await import("@/lib/db/prisma");

  try {
    // 1. Does the product exist, and is it active / not deleted?
    const products = await prisma.product.findMany({
      where: { name: { contains: "relief", mode: "insensitive" } },
      select: { id: true, name: true, sku: true, isActive: true, deletedAt: true },
    });
    console.log("── Products matching 'relief' ──");
    if (!products.length) console.log("  (NONE FOUND — a form pointing at a missing product would reject orders with 422)");
    for (const p of products) {
      console.log(
        `  ${p.name} [${p.id}] sku=${p.sku ?? "-"} active=${p.isActive} deleted=${p.deletedAt ? p.deletedAt.toISOString() : "no"}`
      );
    }

    // 2. Are there any active sales reps? Zero => every form order is rejected (503).
    const activeReps = await prisma.user.count({ where: { role: "SALES_REP", isActive: true } });
    console.log(`\n── Active sales reps (0 = ALL form orders rejected with 503) ──\n  ${activeReps}`);

    // 3. Forms that mention 'relief' — are any disabled/deleted (would 403 new orders)?
    const forms = await prisma.$queryRaw<FormRow[]>`
      SELECT id, name, "disabledAt", "deletedAt"
      FROM forms
      WHERE data::text ILIKE '%relief%'
      ORDER BY "createdAt" DESC`;
    console.log("\n── Forms mentioning 'relief' ──");
    if (!forms.length) console.log("  (none found)");
    for (const f of forms) {
      console.log(
        `  "${f.name}" [${f.id}] disabled=${f.disabledAt ? f.disabledAt.toISOString() : "no"} deleted=${f.deletedAt ? f.deletedAt.toISOString() : "no"}`
      );
    }

    // 4. Every order (incl. soft-deleted) that has a relief item, last 30 days.
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 30 * 864e5) },
        items: { some: { product: { name: { contains: "relief", mode: "insensitive" } } } },
      },
      select: {
        orderNumber: true, status: true, createdAt: true, deletedAt: true, formId: true,
        customer: { select: { name: true, phone: true, whatsappNumber: true } },
        salesRep: { select: { name: true } },
        items: { select: { quantity: true, product: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    console.log(`\n── Orders with a 'relief' item, last 30 days (incl. deleted): ${orders.length} ──`);
    for (const o of orders) {
      const items = o.items.map((i) => `${i.product.name}×${i.quantity}`).join(", ");
      console.log(
        `  ${o.orderNumber}  ${o.status}${o.deletedAt ? " [DELETED]" : ""}  ${o.createdAt.toISOString().slice(0, 16)}  ` +
        `cust=${o.customer?.name ?? "?"} ${o.customer?.phone ?? ""}  rep=${o.salesRep?.name ?? "?"}  form=${o.formId ?? "none"}  {${items}}`
      );
    }

    // 5. Is intake alive at all? Newest 10 orders of ANY product.
    const recent = await prisma.order.findMany({
      where: { deletedAt: null },
      select: {
        orderNumber: true, status: true, createdAt: true, formId: true,
        items: { select: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    console.log("\n── Newest 10 orders overall (is intake flowing?) ──");
    for (const o of recent) {
      const items = o.items.map((i) => i.product.name).join(", ");
      console.log(
        `  ${o.orderNumber}  ${o.status}  ${o.createdAt.toISOString().slice(0, 16)}  form=${o.formId ?? "none"}  {${items}}`
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("Failed:", e);
  process.exit(1);
});
