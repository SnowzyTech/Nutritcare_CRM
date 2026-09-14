/**
 * scripts/trace-order-origin.ts  — READ-ONLY
 *
 * For the two reported customers, shows each order's creation time, whether it
 * carries a formId (public form submission) or not (likely manual), the assigned
 * rep, the customer-record creation time, and the AUDIT LOG rows for the order
 * (which record actorName/actorRole = WHO created it).
 *
 *   node --import tsx scripts/trace-order-origin.ts
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

const NAME_HINTS = ["ejikeme", "ogwo", "peace"];
const PHONE_CORE = "8065057573";

async function main() {
  loadEnv();
  const host = (process.env.DATABASE_URL ?? "").match(/@([^/]+)/)?.[1] ?? "unknown";
  console.log(`Target DB host: ${host}\n`);

  const { prisma } = await import("@/lib/db/prisma");
  try {
    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { phone: { contains: PHONE_CORE } },
          { whatsappNumber: { contains: PHONE_CORE } },
          ...NAME_HINTS.map((n) => ({ name: { contains: n, mode: "insensitive" as const } })),
        ],
      },
      select: {
        id: true, name: true, phone: true, createdAt: true,
        orders: {
          select: {
            id: true, orderNumber: true, status: true, createdAt: true, updatedAt: true,
            formId: true, salesRepId: true,
            salesRep: { select: { name: true, role: true } },
            items: { select: { quantity: true, product: { select: { name: true } } } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`── Matching customers: ${customers.length} ──`);
    for (const c of customers) {
      console.log(`\n■ ${c.name}  phone=${c.phone}  customer-created=${c.createdAt.toISOString()}`);
      for (const o of c.orders) {
        const items = o.items.map((i) => `${i.product.name}×${i.quantity}`).join(", ");
        console.log(
          `  ${o.orderNumber}  ${o.status}\n` +
          `    order-created: ${o.createdAt.toISOString()}\n` +
          `    formId:        ${o.formId ?? "NONE (no form → likely manual entry)"}\n` +
          `    assigned rep:  ${o.salesRep?.name ?? "?"} (${o.salesRep?.role ?? "?"})\n` +
          `    items:         ${items}`
        );

        const logs = await prisma.auditLog.findMany({
          where: { entityType: "Order", entityId: o.id },
          select: { action: true, actorName: true, actorRole: true, userId: true, createdAt: true, details: true },
          orderBy: { createdAt: "asc" },
        });
        console.log(`    ── audit trail (${logs.length}) ──`);
        if (!logs.length) console.log(`       (no audit rows for this order)`);
        for (const l of logs) {
          const d = (l.details ?? {}) as { description?: string };
          console.log(
            `       [${l.createdAt.toISOString()}] ${l.action} by ${l.actorName ?? "SYSTEM/none"} (${l.actorRole ?? "-"})` +
            `${d.description ? ` — ${d.description}` : ""}`
          );
        }
      }
      if (!c.orders.length) console.log("  (no orders)");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error("Failed:", e); process.exit(1); });
