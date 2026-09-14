/**
 * scripts/inspect-relief-forms.ts  — READ-ONLY
 *
 * Compares the two RefliefMax forms: views (hits) vs actual orders, last order,
 * and the product each form points at in its data JSON. Tells us whether the
 * dormant form is BROKEN (has views but no orders) or just UNUSED (no views).
 *
 *   node --import tsx scripts/inspect-relief-forms.ts
 */
import { readFileSync } from "node:fs";

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

const FORM_IDS = [
  "cmtk7f07d0001wmi92vfzg8k4", // RefliefMax Form II AUS (working)
  "cmtil1coo0001luovxb835iol", // RefliefMax Form (dormant?)
];

function pluckProductHints(data: unknown): string[] {
  // Shallowly surface any product-ish keys so we can see what the form points at.
  const out: string[] = [];
  const walk = (v: unknown, path: string) => {
    if (v == null) return;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      if (/product|sku|price|selected/i.test(path)) out.push(`${path} = ${String(v).slice(0, 60)}`);
      return;
    }
    if (Array.isArray(v)) { v.forEach((x, i) => walk(x, `${path}[${i}]`)); return; }
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      walk(val, path ? `${path}.${k}` : k);
    }
  };
  walk(data, "");
  return out.slice(0, 25);
}

async function main() {
  loadEnv();
  const host = (process.env.DATABASE_URL ?? "").match(/@([^/]+)/)?.[1] ?? "unknown";
  console.log(`Target DB host: ${host}\n`);

  const { prisma } = await import("@/lib/db/prisma");
  try {
    for (const id of FORM_IDS) {
      const form = await prisma.form.findUnique({
        where: { id },
        select: { id: true, name: true, hits: true, orders: true, disabledAt: true, deletedAt: true, createdAt: true, data: true },
      });
      if (!form) { console.log(`Form ${id}: NOT FOUND\n`); continue; }

      const liveOrders = await prisma.order.count({ where: { formId: id } });
      const lastOrder = await prisma.order.findFirst({
        where: { formId: id },
        orderBy: { createdAt: "desc" },
        select: { orderNumber: true, createdAt: true },
      });

      console.log(`── "${form.name}" [${form.id}] ──`);
      console.log(`  created:        ${form.createdAt.toISOString().slice(0, 10)}`);
      console.log(`  disabled:       ${form.disabledAt ? form.disabledAt.toISOString() : "no"}`);
      console.log(`  VIEWS (hits):   ${form.hits}`);
      console.log(`  counter.orders: ${form.orders}   (denormalised)`);
      console.log(`  ACTUAL orders:  ${liveOrders}`);
      console.log(`  last order:     ${lastOrder ? `${lastOrder.orderNumber} @ ${lastOrder.createdAt.toISOString().slice(0, 16)}` : "NONE"}`);
      console.log(`  product hints from form.data:`);
      for (const h of pluckProductHints(form.data)) console.log(`      ${h}`);
      console.log("");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error("Failed:", e); process.exit(1); });
