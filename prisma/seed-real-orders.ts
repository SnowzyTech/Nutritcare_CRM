/**
 * One-off script to generate realistic PENDING orders, distributed evenly
 * across the existing sales reps, indistinguishable from real customer
 * orders (same shape as createOrderAction — no seed/test markers of any
 * kind: no special prefix, no tagged customer source, no cleanup hooks).
 *
 * Run:  npx tsx prisma/seed-real-orders.ts
 */

import { PrismaClient } from "@prisma/client";

const TARGET_COUNT = 50;
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

/** Same format createOrderAction uses (lib/utils.ts::generateOrderNumber),
 *  inlined here to avoid path-alias resolution issues under tsx. */
function generateOrderNumber(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 4).padEnd(2, "0");
  return `ORD-${(ts + rand).toUpperCase()}`;
}

// ── Sample data for customers (Nigerian names/addresses) ────────────────────────
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

function makeCustomer() {
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);
  const loc = pick(STATES);
  const lga = pick(loc.lgas);
  const phone = `0${randInt(70, 91)}${randInt(10_000_000, 99_999_999)}`;
  return {
    name: `${first} ${last}`,
    phone,
    whatsappNumber: phone,
    email: Math.random() > 0.3 ? `${first.toLowerCase()}.${last.toLowerCase()}${randInt(1, 999)}@gmail.com` : null,
    deliveryAddress: `${randInt(1, 250)} ${pick(LAST_NAMES)} Street, ${lga}`,
    state: loc.state,
    // Real orders placed via the sales rep "Add Order" form don't collect LGA
    // separately from the free-text address — matches createOrderAction exactly.
    lga: "",
    landmark: null as string | null,
  };
}

async function main() {
  console.log(`Generating ${TARGET_COUNT} PENDING orders, split evenly across existing sales reps\n`);

  const salesReps = await prisma.user.findMany({
    where: { role: { in: ["SALES_REP", "SALES_REP_MANAGER"] }, isActive: true },
    select: { id: true, name: true },
  });
  if (salesReps.length === 0) {
    throw new Error("No sales reps found in the DB.");
  }

  const products = await prisma.product.findMany({
    where: { isActive: true, deletedAt: null },
    select: { id: true, sellingPrice: true, costPrice: true },
  });
  if (products.length === 0) {
    throw new Error("No active products found in the DB.");
  }

  console.log(`  Using ${salesReps.length} sales rep(s) and ${products.length} product(s)`);

  const usedOrderNumbers = new Set<string>();
  function nextOrderNumber(): string {
    let n = generateOrderNumber();
    while (usedOrderNumbers.has(n)) n = generateOrderNumber();
    usedOrderNumbers.add(n);
    return n;
  }

  let created = 0;
  for (let i = 0; i < TARGET_COUNT; i++) {
    const rep = salesReps[i % salesReps.length]; // even round-robin spread
    const customerData = makeCustomer();
    const when = recentDate();

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

    await prisma.order.create({
      data: {
        orderNumber: nextOrderNumber(),
        status: "PENDING",
        totalAmount: total,
        netAmount: total,
        isReorder: false,
        date: when,
        createdAt: when,
        salesRep: { connect: { id: rep.id } },
        customer: { create: customerData },
        items: { create: items },
      },
    });

    created++;
    if (created % 10 === 0) console.log(`  ... ${created}/${TARGET_COUNT} orders created`);
  }

  console.log(`\n✓ Done. Created ${created} PENDING orders across ${salesReps.length} sales rep(s).`);
}

main()
  .catch((e) => {
    console.error("Order generation failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
