/**
 * Seed script — populates the DB with representative test data for every order status.
 *
 * Safe to re-run: deletes all previously seeded records (identified by SEED- prefix
 * and @seed.test / @seed.nutritcare email suffixes) before inserting fresh ones.
 *
 * Run:  npm run db:seed
 */

import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

// ── Inline the same Neon-aware client logic from lib/db/prisma.ts ──────────────
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

// ── Prices kept as plain numbers so arithmetic stays clean ──────────────────────
const PRICES = {
  prosxact:  { cost: 15_000, sell: 21_000 },
  shredBelly:{ cost: 12_000, sell: 16_500 },
  fonioMill: { cost:  8_000, sell: 11_000 },
  trimTone:  { cost: 14_000, sell: 19_500 },
  neuroBalm: { cost:  9_000, sell: 14_000 },
};

// ── Cleanup helpers ─────────────────────────────────────────────────────────────
async function cleanSeedData() {
  const seedOrders = await prisma.order.findMany({
    where: { orderNumber: { startsWith: "SEED-" } },
    select: { id: true },
  });
  const ids = seedOrders.map((o) => o.id);

  if (ids.length > 0) {
    const invoices = await prisma.invoice.findMany({
      where: { orderId: { in: ids } },
      select: { id: true },
    });
    if (invoices.length) {
      await prisma.invoiceItem.deleteMany({ where: { invoiceId: { in: invoices.map((i) => i.id) } } });
      await prisma.invoice.deleteMany({ where: { id: { in: invoices.map((i) => i.id) } } });
    }
    await prisma.delivery.deleteMany({ where: { orderId: { in: ids } } });
    await prisma.pickPack.deleteMany({ where: { orderId: { in: ids } } });
    await prisma.order.deleteMany({ where: { id: { in: ids } } }); // cascades OrderItems
  }

  await prisma.agent.deleteMany({ where: { phone1: { startsWith: "+2340000" } } });
  await prisma.customer.deleteMany({ where: { email: { endsWith: "@seed.test" } } });
  await prisma.product.deleteMany({ where: { sku: { startsWith: "SEED-" } } });
  await prisma.productCategory.deleteMany({ where: { categoryName: "Nutricare [SEED]" } });
  await prisma.user.deleteMany({ where: { email: { endsWith: "@seed.nutritcare" } } });
}

// ── Main ────────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🧹  Cleaning previous seed data...");
  await cleanSeedData();
  console.log("🌱  Inserting fresh seed data...\n");

  // ── Users ──────────────────────────────────────────────────────────────────
  const [salesRep, adminUser] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Adebimpe Tolani",
        email: "tolani@seed.nutritcare",
        password: await bcrypt.hash("SalesRep@123", 10),
        role: "SALES_REP",
        phone: "+2348023784913",
        isActive: true,
        accountActivationStatus: "APPROVED",
      },
    }),
    prisma.user.create({
      data: {
        name: "Admin User",
        email: "admin@seed.nutritcare",
        password: await bcrypt.hash("Admin@123", 10),
        role: "ADMIN",
        phone: "+2340000000000",
        isActive: true,
        accountActivationStatus: "APPROVED",
      },
    }),
  ]);

  // ── Product Category ────────────────────────────────────────────────────────
  const category = await prisma.productCategory.create({
    data: {
      categoryName: "Nutricare [SEED]",
      brandName: "Nutricare",
      brandPhone: "+2348012345678",
    },
  });

  // ── Products ────────────────────────────────────────────────────────────────
  const [prosxact, shredBelly, fonioMill, trimTone, neuroBalm] = await Promise.all([
    prisma.product.create({ data: { name: "Prosxact",        costPrice: PRICES.prosxact.cost,  sellingPrice: PRICES.prosxact.sell,  sku: "SEED-PRX-001", categoryId: category.id, isActive: true } }),
    prisma.product.create({ data: { name: "Shred Belly",     costPrice: PRICES.shredBelly.cost, sellingPrice: PRICES.shredBelly.sell,sku: "SEED-SHB-002", categoryId: category.id, isActive: true } }),
    prisma.product.create({ data: { name: "Fonio-Mill",      costPrice: PRICES.fonioMill.cost,  sellingPrice: PRICES.fonioMill.sell, sku: "SEED-FNM-003", categoryId: category.id, isActive: true } }),
    prisma.product.create({ data: { name: "Trim and Tone",   costPrice: PRICES.trimTone.cost,   sellingPrice: PRICES.trimTone.sell,  sku: "SEED-TAT-004", categoryId: category.id, isActive: true } }),
    prisma.product.create({ data: { name: "Neuro-Vive Balm", costPrice: PRICES.neuroBalm.cost,  sellingPrice: PRICES.neuroBalm.sell, sku: "SEED-NVB-005", categoryId: category.id, isActive: true } }),
  ]);

  // ── Agents ──────────────────────────────────────────────────────────────────
  const [agentOla, agentQudus, agentSunmi, agentFlymack] = await Promise.all([
    prisma.agent.create({ data: { companyName: "Mr. Ola Logistics",  state: "Lagos State",  phone1: "+2340000111111", status: "ACTIVE", addedById: adminUser.id } }),
    prisma.agent.create({ data: { companyName: "Mr. Qudus Delivery", state: "Lagos State",  phone1: "+2340000222222", status: "ACTIVE", addedById: adminUser.id } }),
    prisma.agent.create({ data: { companyName: "Mrs. Sunmi Express", state: "Oyo State",    phone1: "+2340000333333", status: "ACTIVE", addedById: adminUser.id } }),
    prisma.agent.create({ data: { companyName: "Flymack Couriers",   state: "Kaduna State", phone1: "+2340000444444", status: "ACTIVE", addedById: adminUser.id } }),
  ]);

  // ── Customers ───────────────────────────────────────────────────────────────
  const [
    adewale, funke, ibrahim, chinedu,
    blessing, sola, halima, victor, samuel,
  ] = await Promise.all([
    prisma.customer.create({ data: { name: "Adewale Johnson",  phone: "+2348023784913", email: "adewale@seed.test",  deliveryAddress: "15 Adeyemi Crescent, Bodija, Ibadan",         state: "Oyo State",    lga: "Ibadan North",  landmark: "Bodija Market",  source: "WhatsApp"  } }),
    prisma.customer.create({ data: { name: "Funke Adebayo",    phone: "+2348127746632", email: "funke@seed.test",    deliveryAddress: "22 Opebi Road, Ikeja, Lagos",                  state: "Lagos State",  lga: "Ikeja",         landmark: "Opebi Mall",     source: "WhatsApp"  } }),
    prisma.customer.create({ data: { name: "Ibrahim Musa",     phone: "+2348091185044", email: "ibrahim@seed.test",  deliveryAddress: "7 Constitution Road, Kaduna",                 state: "Kaduna State", lga: "Kaduna North",  landmark: null,             source: "Instagram" } }),
    prisma.customer.create({ data: { name: "Chinedu Okafor",   phone: "+2348034561290", email: "chinedu@seed.test",  deliveryAddress: "4 Trans Amadi Industrial Layout, Port Harcourt",state: "Rivers State", lga: "Port Harcourt", landmark: null,             source: "WhatsApp"  } }),
    prisma.customer.create({ data: { name: "Blessing Eze",     phone: "+2348034561291", email: "blessing@seed.test", deliveryAddress: "10 New Haven Road, Enugu",                    state: "Enugu State",  lga: "Enugu North",   landmark: null,             source: "Facebook"  } }),
    prisma.customer.create({ data: { name: "Sola Ogunleye",    phone: "+2348034561292", email: "sola@seed.test",     deliveryAddress: "33 Awolowo Road, Ikoyi, Lagos",               state: "Lagos State",  lga: "Lagos Island",  landmark: null,             source: "WhatsApp"  } }),
    prisma.customer.create({ data: { name: "Halima Abdullahi", phone: "+2348034561293", email: "halima@seed.test",   deliveryAddress: "5 Ahmadu Bello Way, Abuja",                   state: "FCT Abuja",    lga: "Wuse",          landmark: null,             source: "WhatsApp"  } }),
    prisma.customer.create({ data: { name: "Victor Uche",      phone: "+2348034561294", email: "victor@seed.test",   deliveryAddress: "No. 42 Adeoyo Ring Road, Ibadan",             state: "Oyo State",    lga: "Ibadan North",  landmark: "Near UCH",       source: "WhatsApp"  } }),
    prisma.customer.create({ data: { name: "Samuel Adebayo",   phone: "+2348034561295", email: "samuel@seed.test",   deliveryAddress: "15 Adeyemi Crescent, Bodija Estate, Ibadan",  state: "Oyo State",    lga: "Ibadan North",  landmark: "Bodija Market",  source: "Referral"  } }),
  ]);

  // ── Orders ──────────────────────────────────────────────────────────────────
  let seq = 1;
  const num = () => `SEED-ORD-${String(seq++).padStart(4, "0")}`;

  // ─ PENDING (4 orders) ─────────────────────────────────────────────────────

  // #1 — Adewale: 3× Prosxact
  const p1 = PRICES.prosxact.sell * 3;
  const order1 = await prisma.order.create({ data: {
    orderNumber: num(), customerId: adewale.id, salesRepId: salesRep.id,
    status: "PENDING", totalAmount: p1, netAmount: p1, deliveryFee: 0,
    items: { create: { productId: prosxact.id, quantity: 3, unitPrice: PRICES.prosxact.sell, lineTotal: p1 } },
  }});

  // #2 — Funke: 2× Shred Belly
  const p2 = PRICES.shredBelly.sell * 2;
  const order2 = await prisma.order.create({ data: {
    orderNumber: num(), customerId: funke.id, salesRepId: salesRep.id,
    status: "PENDING", totalAmount: p2, netAmount: p2, deliveryFee: 0,
    items: { create: { productId: shredBelly.id, quantity: 2, unitPrice: PRICES.shredBelly.sell, lineTotal: p2 } },
  }});

  // #3 — Sola: 3× Prosxact + 1× Shred Belly  (multi-item — tests "Add Product" flow)
  const p3a = PRICES.prosxact.sell * 3;
  const p3b = PRICES.shredBelly.sell;
  const order3 = await prisma.order.create({ data: {
    orderNumber: num(), customerId: sola.id, salesRepId: salesRep.id,
    status: "PENDING", totalAmount: p3a + p3b, netAmount: p3a + p3b, deliveryFee: 0,
    items: { create: [
      { productId: prosxact.id,   quantity: 3, unitPrice: PRICES.prosxact.sell,   lineTotal: p3a },
      { productId: shredBelly.id, quantity: 1, unitPrice: PRICES.shredBelly.sell, lineTotal: p3b },
    ]},
  }});

  // #4 — Victor: 6× Shred Belly
  const p4 = PRICES.shredBelly.sell * 6;
  const order4 = await prisma.order.create({ data: {
    orderNumber: num(), customerId: victor.id, salesRepId: salesRep.id,
    status: "PENDING", totalAmount: p4, netAmount: p4, deliveryFee: 0,
    items: { create: { productId: shredBelly.id, quantity: 6, unitPrice: PRICES.shredBelly.sell, lineTotal: p4 } },
  }});

  // ─ CONFIRMED (2 orders) ───────────────────────────────────────────────────

  // #5 — Chinedu: 4× Trim and Tone, agent: Qudus
  const p5 = PRICES.trimTone.sell * 4;
  const order5 = await prisma.order.create({ data: {
    orderNumber: num(), customerId: chinedu.id, salesRepId: salesRep.id, agentId: agentQudus.id,
    status: "CONFIRMED", totalAmount: p5, netAmount: p5, deliveryFee: 2025,
    items: { create: { productId: trimTone.id, quantity: 4, unitPrice: PRICES.trimTone.sell, lineTotal: p5 } },
  }});

  // #6 — Halima: 6× Shred Belly, agent: Sunmi
  const p6 = PRICES.shredBelly.sell * 6;
  const order6 = await prisma.order.create({ data: {
    orderNumber: num(), customerId: halima.id, salesRepId: salesRep.id, agentId: agentSunmi.id,
    status: "CONFIRMED", totalAmount: p6, netAmount: p6, deliveryFee: 1500,
    items: { create: { productId: shredBelly.id, quantity: 6, unitPrice: PRICES.shredBelly.sell, lineTotal: p6 } },
  }});

  // ─ DELIVERED (2 orders, each with a Delivery record) ─────────────────────

  // #7 — Samuel: 2× Prosxact, agent: Flymack
  const p7 = PRICES.prosxact.sell * 2;
  const order7 = await prisma.order.create({ data: {
    orderNumber: num(), customerId: samuel.id, salesRepId: salesRep.id, agentId: agentFlymack.id,
    status: "DELIVERED", totalAmount: p7, netAmount: p7, deliveryFee: 1000,
    items: { create: { productId: prosxact.id, quantity: 2, unitPrice: PRICES.prosxact.sell, lineTotal: p7 } },
  }});
  await prisma.delivery.create({ data: {
    orderId: order7.id, agentId: agentFlymack.id, status: "DELIVERED",
    scheduledTime: new Date("2026-02-03T10:00:00Z"),
    deliveredTime:  new Date("2026-02-03T16:45:00Z"),
  }});

  // #8 — Adewale: 1× Prosxact + 2× Fonio-Mill, agent: Ola  (multi-item delivered)
  const p8a = PRICES.prosxact.sell;
  const p8b = PRICES.fonioMill.sell * 2;
  const order8 = await prisma.order.create({ data: {
    orderNumber: num(), customerId: adewale.id, salesRepId: salesRep.id, agentId: agentOla.id,
    status: "DELIVERED", totalAmount: p8a + p8b, netAmount: p8a + p8b, deliveryFee: 1200,
    items: { create: [
      { productId: prosxact.id,  quantity: 1, unitPrice: PRICES.prosxact.sell,  lineTotal: p8a },
      { productId: fonioMill.id, quantity: 2, unitPrice: PRICES.fonioMill.sell, lineTotal: p8b },
    ]},
  }});
  await prisma.delivery.create({ data: {
    orderId: order8.id, agentId: agentOla.id, status: "DELIVERED",
    scheduledTime: new Date("2026-01-20T09:00:00Z"),
    deliveredTime:  new Date("2026-01-20T14:30:00Z"),
  }});

  // ─ CANCELLED (1 order) ────────────────────────────────────────────────────

  // #9 — Blessing: 1× Neuro-Vive Balm
  const p9 = PRICES.neuroBalm.sell;
  const order9 = await prisma.order.create({ data: {
    orderNumber: num(), customerId: blessing.id, salesRepId: salesRep.id,
    status: "CANCELLED", totalAmount: p9, netAmount: p9, deliveryFee: 0,
    items: { create: { productId: neuroBalm.id, quantity: 1, unitPrice: PRICES.neuroBalm.sell, lineTotal: p9 } },
  }});

  // ─ FAILED (1 order) ───────────────────────────────────────────────────────

  // #10 — Ibrahim: 5× Fonio-Mill, agent: Ola
  const p10 = PRICES.fonioMill.sell * 5;
  const order10 = await prisma.order.create({ data: {
    orderNumber: num(), customerId: ibrahim.id, salesRepId: salesRep.id, agentId: agentOla.id,
    status: "FAILED", totalAmount: p10, netAmount: p10, deliveryFee: 2000,
    items: { create: { productId: fonioMill.id, quantity: 5, unitPrice: PRICES.fonioMill.sell, lineTotal: p10 } },
  }});

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log("✅  Done!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔑  LOGIN CREDENTIALS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Sales Rep  │  tolani@seed.nutritcare  │  SalesRep@123");
  console.log("  Admin      │  admin@seed.nutritcare   │  Admin@123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📦  ORDERS CREATED");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const orders = [
    { status: "PENDING",   num: order1.orderNumber,  desc: "Adewale    — 3× Prosxact",             id: order1.id },
    { status: "PENDING",   num: order2.orderNumber,  desc: "Funke      — 2× Shred Belly",           id: order2.id },
    { status: "PENDING",   num: order3.orderNumber,  desc: "Sola       — 3× Prosxact + 1× Shred Belly (multi-item)", id: order3.id },
    { status: "PENDING",   num: order4.orderNumber,  desc: "Victor     — 6× Shred Belly",           id: order4.id },
    { status: "CONFIRMED", num: order5.orderNumber,  desc: "Chinedu    — 4× Trim and Tone (Qudus)", id: order5.id },
    { status: "CONFIRMED", num: order6.orderNumber,  desc: "Halima     — 6× Shred Belly (Sunmi)",   id: order6.id },
    { status: "DELIVERED", num: order7.orderNumber,  desc: "Samuel     — 2× Prosxact (Flymack)",    id: order7.id },
    { status: "DELIVERED", num: order8.orderNumber,  desc: "Adewale    — 1× Prosxact + 2× Fonio-Mill (Ola)", id: order8.id },
    { status: "CANCELLED", num: order9.orderNumber,  desc: "Blessing   — 1× Neuro-Vive Balm",       id: order9.id },
    { status: "FAILED",    num: order10.orderNumber, desc: "Ibrahim    — 5× Fonio-Mill (Ola)",       id: order10.id },
  ];
  for (const o of orders) {
    console.log(`  [${o.status.padEnd(9)}]  ${o.num.padEnd(18)}  ${o.desc}`);
  }
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n💡  Detail page URLs (copy any into your browser):");
  for (const o of orders) {
    console.log(`     /sales-rep/orders/${o.id}  →  ${o.num} (${o.status})`);
  }
  console.log("");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
