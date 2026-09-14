/**
 * scripts/find-customer.ts  — READ-ONLY
 *
 * Searches the WHOLE database for a customer (by name / phone / address),
 * across every product & form, including soft-deleted orders. Also reports
 * whether a customer record exists WITHOUT any order (= submission reached the
 * server and the order failed to save).
 *
 *   node --import tsx scripts/find-customer.ts
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

// Core digits shared by 08065057573 / 2348065057573 / +2348065057573
const PHONE_CORE = "8065057573";
const NAME_HINTS = ["ejikeme", "michael"];
const ADDRESS_HINT = "iwegie";

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
          { deliveryAddress: { contains: ADDRESS_HINT, mode: "insensitive" } },
          ...NAME_HINTS.map((n) => ({ name: { contains: n, mode: "insensitive" as const } })),
        ],
      },
      select: {
        id: true, name: true, phone: true, whatsappNumber: true,
        deliveryAddress: true, state: true, createdAt: true,
        orders: {
          select: {
            orderNumber: true, status: true, createdAt: true, deletedAt: true, formId: true,
            items: { select: { quantity: true, product: { select: { name: true } } } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`── Matching customer records: ${customers.length} ──`);
    for (const c of customers) {
      console.log(
        `\n  ${c.name}  | phone=${c.phone} wa=${c.whatsappNumber ?? "-"} | ${c.state ?? ""} | ${c.deliveryAddress ?? ""}`
      );
      console.log(`    customer created: ${c.createdAt.toISOString().slice(0, 16)}  | orders: ${c.orders.length}`);
      if (c.orders.length === 0) {
        console.log(`    ⚠️  CUSTOMER EXISTS BUT HAS NO ORDER — submission reached the server, order did not save.`);
      }
      for (const o of c.orders) {
        const items = o.items.map((i) => `${i.product.name}×${i.quantity}`).join(", ");
        console.log(
          `    → ${o.orderNumber} ${o.status}${o.deletedAt ? " [DELETED]" : ""} ${o.createdAt.toISOString().slice(0, 16)} form=${o.formId ?? "none"} {${items}}`
        );
      }
    }
    if (!customers.length) {
      console.log("  NONE — no customer record at all. The submission never reached the server / DB.");
    }

    // Reconfirm the two relief forms' disabled state (answering 'was it disabled?').
    const forms = await prisma.form.findMany({
      where: { id: { in: ["cmtk7f07d0001wmi92vfzg8k4", "cmtil1coo0001luovxb835iol"] } },
      select: { id: true, name: true, disabledAt: true, deletedAt: true },
    });
    console.log("\n── Relief forms status ──");
    for (const f of forms) {
      console.log(`  "${f.name}" disabled=${f.disabledAt ? f.disabledAt.toISOString() : "NO"} deleted=${f.deletedAt ? f.deletedAt.toISOString() : "NO"}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error("Failed:", e); process.exit(1); });
