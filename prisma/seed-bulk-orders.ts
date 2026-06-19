/**
 * Bulk test-order seeder — creates 250 PENDING orders for the client to test with.
 *
 * Each order:
 *   - is assigned to one of the EXISTING sales reps in the DB (round-robin/random),
 *   - uses your REAL product catalog (existing active products),
 *   - is linked to a freshly-created test customer (tagged for easy cleanup),
 *   - is left in PENDING status with NO agent — the sales reps confirm / assign /
 *     deliver by hand as part of their testing.
 *
 * Identifiable + re-runnable: every record carries a BULK- marker, so re-running
 * deletes the previous batch first and re-creates exactly 250. It never touches
 * SEED- data or real production data.
 *
 * Run:  npx tsx prisma/seed-bulk-orders.ts
 */

import { PrismaClient } from "@prisma/client";

// ── Markers used to identify (and clean up) this batch ──────────────────────────
const ORDER_PREFIX = "BULK-ORD-";
const CUSTOMER_SOURCE = "BULK-TEST";
const TARGET_COUNT = 250;
const DAYS_BACK = 30;

// ── Neon-aware client (same logic as lib/db/prisma.ts) ──────────────────────────
function createClient() {
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

const prisma = createClient() as PrismaClient;

// ── Random helpers ──────────────────────────────────────────────────────────────
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/** A random date/time within the last DAYS_BACK days. */
function recentDate(): Date {
  const now = Date.now();
  const offsetMs = randInt(0, DAYS_BACK * 24 * 60 * 60 * 1000);
  return new Date(now - offsetMs);
}

// ── Sample data for fresh test customers ────────────────────────────────────────
const FIRST_NAMES = [
  "Adaeze", "Chinedu", "Funmilayo", "Ibrahim", "Ngozi", "Tunde", "Halima", "Emeka",
  "Bukola", "Yusuf", "Chiamaka", "Segun", "Aisha", "Obinna", "Folake", "Musa",
  "Ifeoma", "Bashir", "Oluwaseun", "Zainab", "Kelechi", "Damilola", "Nneka", "Sani",
];
const LAST_NAMES = [
  "Okafor", "Bello", "Adeyemi", "Eze", "Mohammed", "Okonkwo", "Balogun", "Nwosu",
  "Abubakar", "Olawale", "Uche", "Ibrahim", "Adebayo", "Lawal", "Chukwu", "Suleiman",
];
const STATES: { state: string; lgas: string[] }[] = [
  { state: "Lagos", lgas: ["Ikeja", "Surulere", "Lekki", "Yaba", "Alimosho"] },
  { state: "Abuja (FCT)", lgas: ["Garki", "Wuse", "Maitama", "Gwarinpa", "Kubwa"] },
  { state: "Oyo", lgas: ["Ibadan North", "Ibadan South-West", "Egbeda"] },
  { state: "Rivers", lgas: ["Port Harcourt", "Obio-Akpor"] },
  { state: "Kano", lgas: ["Nassarawa", "Fagge", "Tarauni"] },
  { state: "Enugu", lgas: ["Enugu North", "Enugu South"] },
];
const CONTACT_METHODS = ["PHONE", "WHATSAPP"] as const;

function makeCustomer(i: number) {
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);
  const loc = pick(STATES);
  const lga = pick(loc.lgas);
  const phone = `0${randInt(70, 91)}${randInt(10_000_000, 99_999_999)}`;
  return {
    name: `${first} ${last}`,
    phone,
    whatsappNumber: phone,
    email: `${first.toLowerCase()}.${last.toLowerCase()}.${i}@bulktest.local`,
    deliveryAddress: `${randInt(1, 250)} ${pick(LAST_NAMES)} Street, ${lga}`,
    state: loc.state,
    lga,
    source: CUSTOMER_SOURCE,
  };
}

async function cleanPreviousBatch() {
  // Orders first (cascades their OrderItems), then the tagged customers.
  const del = await prisma.order.deleteMany({
    where: { orderNumber: { startsWith: ORDER_PREFIX } },
  });
  const delCust = await prisma.customer.deleteMany({
    where: { source: CUSTOMER_SOURCE },
  });
  console.log(`  ✓ Cleaned previous batch: ${del.count} orders, ${delCust.count} customers`);
}

async function main() {
  console.log("Bulk order seeder — creating 250 PENDING test orders\n");

  // ── 1. Existing sales reps to assign orders to ────────────────────────────────
  const salesReps = await prisma.user.findMany({
    where: { role: { in: ["SALES_REP", "SALES_REP_MANAGER"] }, isActive: true },
    select: { id: true, name: true },
  });
  if (salesReps.length === 0) {
    throw new Error(
      "No sales reps found in the DB. Create at least one SALES_REP user (or run the main seed) first.",
    );
  }

  // ── 2. Existing active products from the real catalog ─────────────────────────
  const products = await prisma.product.findMany({
    where: { isActive: true, deletedAt: null },
    select: { id: true, sellingPrice: true, costPrice: true },
  });
  if (products.length === 0) {
    throw new Error(
      "No active products found in the DB. Add products (or run the main seed) first.",
    );
  }

  console.log(`  Using ${salesReps.length} sales rep(s) and ${products.length} product(s)`);

  // ── 3. Wipe any prior bulk batch so re-runs stay at exactly 250 ───────────────
  await cleanPreviousBatch();

  // ── 4. Create the 250 orders ──────────────────────────────────────────────────
  let created = 0;
  for (let i = 1; i <= TARGET_COUNT; i++) {
    const rep = salesReps[(i - 1) % salesReps.length]; // even spread across reps
    const customerData = makeCustomer(i);
    const createdAt = recentDate();

    // 1–3 distinct line items per order
    const itemCount = randInt(1, 3);
    const chosen = new Set<number>();
    while (chosen.size < Math.min(itemCount, products.length)) {
      chosen.add(randInt(0, products.length - 1));
    }

    let total = 0;
    const items = [...chosen].map((idx) => {
      const product = products[idx];
      const unitPrice = Number(product.sellingPrice);
      const quantity = randInt(1, 5);
      const lineTotal = unitPrice * quantity;
      total += lineTotal;
      return {
        productId: product.id,
        quantity,
        unitPrice,
        lineTotal,
        costPriceAtSale: Number(product.costPrice),
      };
    });

    const deliveryFee = pick([0, 1000, 1200, 1500, 2000]);

    await prisma.order.create({
      data: {
        orderNumber: `${ORDER_PREFIX}${String(i).padStart(4, "0")}`,
        status: "PENDING",
        totalAmount: total,
        netAmount: total,
        deliveryFee,
        contactMethod: pick([...CONTACT_METHODS]),
        date: createdAt,
        createdAt,
        salesRep: { connect: { id: rep.id } },
        customer: { create: customerData },
        items: { create: items },
      },
    });

    created++;
    if (created % 50 === 0) console.log(`  ... ${created}/${TARGET_COUNT} orders created`);
  }

  console.log(`\n✓ Done. Created ${created} PENDING orders (prefix ${ORDER_PREFIX}).`);
}

main()
  .catch((e) => {
    console.error("Bulk seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
