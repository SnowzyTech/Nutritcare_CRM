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
  prosxact:   { cost: 15_000, sell: 21_000 },
  shredBelly: { cost: 12_000, sell: 16_500 },
  fonioMill:  { cost:  8_000, sell: 11_000 },
  trimTone:   { cost: 14_000, sell: 19_500 },
  neuroBalm:  { cost:  9_000, sell: 14_000 },
  afterNatal: { cost: 10_000, sell: 15_000 },
  linix:      { cost:  7_500, sell: 12_500 },
};

// ── Date helpers ────────────────────────────────────────────────────────────────
const d = (iso: string) => new Date(iso);

// ── Cleanup helpers ─────────────────────────────────────────────────────────────
async function cleanSeedData() {
  // ── Inventory cleanup (before agent/order cleanup due to FK refs) ────────────
  const seedMovementIds = (await prisma.stockMovement.findMany({
    where: { referenceNumber: { startsWith: "SEED-S" } },
    select: { id: true },
  })).map((m) => m.id);
  if (seedMovementIds.length > 0) {
    await prisma.goodsReceiving.deleteMany({ where: { stockMovementId: { in: seedMovementIds } } });
    await prisma.stockMovement.deleteMany({ where: { id: { in: seedMovementIds } } }); // cascades items
  }
  await prisma.stockTransfer.deleteMany({ where: { referenceNumber: { startsWith: "SEED-ST" } } }); // cascades items
  await prisma.purchaseOrder.deleteMany({ where: { poNumber: { startsWith: "SEED-PO" } } }); // cascades items
  await prisma.supplier.deleteMany({ where: { phone1: { startsWith: "+234SEED" } } });
  await prisma.warehouse.deleteMany({ where: { name: { startsWith: "[SEED]" } } });

  // ── Order cleanup ─────────────────────────────────────────────────────────────
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

  // Clear agentId on seed delivery-agent users before deleting agents (FK constraint)
  await prisma.user.updateMany({
    where: { email: { endsWith: "@seed.nutritcare" }, role: "DELIVERY_AGENT" },
    data: { agentId: null },
  });

  // Delete seed agents by phone prefix
  await prisma.agent.deleteMany({ where: { phone1: { startsWith: "+2340000" } } });

  // Delete any remaining agents added by seed users (FK: agents.addedById → users.id).
  // This covers agents created via the app while logged in as a seed user.
  const seedUserIds = (await prisma.user.findMany({
    where: { email: { endsWith: "@seed.nutritcare" } },
    select: { id: true },
  })).map((u) => u.id);

  const extraAgentIds = (await prisma.agent.findMany({
    where: { addedById: { in: seedUserIds } },
    select: { id: true },
  })).map((a) => a.id);

  if (extraAgentIds.length > 0) {
    await prisma.delivery.deleteMany({ where: { agentId: { in: extraAgentIds } } });
    await prisma.order.updateMany({ where: { agentId: { in: extraAgentIds } }, data: { agentId: null } });
    await prisma.agent.deleteMany({ where: { id: { in: extraAgentIds } } });
  }

  await prisma.customer.deleteMany({ where: { email: { endsWith: "@seed.test" } } });
  await prisma.product.deleteMany({ where: { sku: { startsWith: "SEED-" } } });
  await prisma.productCategory.deleteMany({ where: { categoryName: "Nutricare [SEED]" } });
  await prisma.user.deleteMany({ where: { email: { endsWith: "@seed.nutritcare" } } });
  await prisma.team.deleteMany({ where: { name: { startsWith: "[SEED]" } } });
}

// ── Main ────────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🧹  Cleaning previous seed data...");
  await cleanSeedData();
  console.log("🌱  Inserting fresh seed data...\n");

  // ── Users ──────────────────────────────────────────────────────────────────
  const [salesRep, adminUser, chiamaka, blessingE, emeka] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Adebimpe Tolani",
        email: "tolani@seed.nutritcare",
        password: await bcrypt.hash("SalesRep@123", 10),
        role: "SALES_REP",
        phone: "+2348023784913",
        whatsappNumber: "+2348023784913",
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
    prisma.user.create({
      data: {
        name: "Chiamaka Okorie",
        email: "chiamaka@seed.nutritcare",
        password: await bcrypt.hash("SalesRep@123", 10),
        role: "SALES_REP",
        phone: "+2347063814402",
        whatsappNumber: "+2347063814402",
        isActive: true,
        accountActivationStatus: "APPROVED",
      },
    }),
    prisma.user.create({
      data: {
        name: "Blessing Ehijie",
        email: "blessing.ehijie@seed.nutritcare",
        password: await bcrypt.hash("SalesRep@123", 10),
        role: "SALES_REP",
        phone: "+2348035472198",
        whatsappNumber: "+2348035472198",
        isActive: true,
        accountActivationStatus: "APPROVED",
      },
    }),
    prisma.user.create({
      data: {
        name: "Emeka Nwankwo",
        email: "emeka@seed.nutritcare",
        password: await bcrypt.hash("SalesRep@123", 10),
        role: "SALES_REP",
        phone: "+2348136087749",
        whatsappNumber: "+2348136087749",
        isActive: true,
        accountActivationStatus: "APPROVED",
      },
    }),
  ]);

  // ── Teams ──────────────────────────────────────────────────────────────────
  const [teamSales1, teamSales2, teamSales3, teamSales4, teamInvLog1, teamInvLog2, teamAcct1, teamData1] = await Promise.all([
    prisma.team.create({ data: { name: "[SEED] Sales Team 1",           department: "SALES" } }),
    prisma.team.create({ data: { name: "[SEED] Sales Team 2",           department: "SALES" } }),
    prisma.team.create({ data: { name: "[SEED] Sales Team 3",           department: "SALES" } }),
    prisma.team.create({ data: { name: "[SEED] Sales Team 4",           department: "SALES" } }),
    prisma.team.create({ data: { name: "[SEED] Inventory Team 1",       department: "INVENTORY_LOGISTICS" } }),
    prisma.team.create({ data: { name: "[SEED] Logistics Team 2",       department: "INVENTORY_LOGISTICS" } }),
    prisma.team.create({ data: { name: "[SEED] Accounting Team 1",      department: "ACCOUNTING" } }),
    prisma.team.create({ data: { name: "[SEED] Data Team 1",            department: "DATA" } }),
  ]);

  // ── Assign sales reps to teams ───────────────────────────────────────────
  await Promise.all([
    prisma.user.update({ where: { id: salesRep.id }, data: { teamId: teamSales1.id } }),
    prisma.user.update({ where: { id: chiamaka.id }, data: { teamId: teamSales2.id } }),
    prisma.user.update({ where: { id: blessingE.id }, data: { teamId: teamSales3.id } }),
    prisma.user.update({ where: { id: emeka.id },    data: { teamId: teamSales4.id } }),
  ]);

  // ── Team Leads (APPROVED) ──────────────────────────────────────────────────
  await Promise.all([
    prisma.user.create({ data: { name: "Victoria Ademuyiwa", email: "victoria@seed.nutritcare", password: await bcrypt.hash("TeamLead@123", 10), role: "SALES_REP",           isActive: true, isTeamLead: true, accountActivationStatus: "APPROVED", teamId: teamSales1.id } }),
    prisma.user.create({ data: { name: "Chinedu Okafor",     email: "chinedu@seed.nutritcare",  password: await bcrypt.hash("TeamLead@123", 10), role: "SALES_REP",           isActive: true, isTeamLead: true, accountActivationStatus: "APPROVED", teamId: teamSales2.id } }),
    prisma.user.create({ data: { name: "Tunde Adeyemi",      email: "tunde@seed.nutritcare",    password: await bcrypt.hash("TeamLead@123", 10), role: "SALES_REP",           isActive: true, isTeamLead: true, accountActivationStatus: "APPROVED", teamId: teamSales3.id } }),
    prisma.user.create({ data: { name: "Zainab Musa",        email: "zainab@seed.nutritcare",   password: await bcrypt.hash("TeamLead@123", 10), role: "SALES_REP",           isActive: true, isTeamLead: true, accountActivationStatus: "APPROVED", teamId: teamSales4.id } }),
    prisma.user.create({ data: { name: "Emeka Nwankwo",      email: "emeka.tl@seed.nutritcare", password: await bcrypt.hash("TeamLead@123", 10), role: "INVENTORY_MANAGER",   isActive: true, isTeamLead: true, accountActivationStatus: "APPROVED", teamId: teamInvLog1.id } }),
    prisma.user.create({ data: { name: "Tolulope Adebayo",   email: "tolulope@seed.nutritcare", password: await bcrypt.hash("TeamLead@123", 10), role: "LOGISTICS_MANAGER",   isActive: true, isTeamLead: true, accountActivationStatus: "APPROVED", teamId: teamInvLog2.id } }),
    prisma.user.create({ data: { name: "Ngozi Eze",          email: "ngozi@seed.nutritcare",    password: await bcrypt.hash("TeamLead@123", 10), role: "ACCOUNTANT",          isActive: true, isTeamLead: true, accountActivationStatus: "APPROVED", teamId: teamAcct1.id } }),
    prisma.user.create({ data: { name: "Samuel Olatunji",    email: "samuel@seed.nutritcare",   password: await bcrypt.hash("TeamLead@123", 10), role: "DATA_ANALYST",        isActive: true, isTeamLead: true, accountActivationStatus: "APPROVED", teamId: teamData1.id } }),
  ]);

  // ── Pending Activation Requests ───────────────────────────────────────────
  await Promise.all([
    prisma.user.create({ data: { name: "Oyindamola Joseph",  email: "oyinda@seed.nutritcare",   password: await bcrypt.hash("Pending@123", 10), role: "SALES_REP",         isActive: false, accountActivationStatus: "PENDING" } }),
    prisma.user.create({ data: { name: "Makinde Wale",       email: "makinde@seed.nutritcare",  password: await bcrypt.hash("Pending@123", 10), role: "INVENTORY_MANAGER", isActive: false, accountActivationStatus: "PENDING" } }),
    prisma.user.create({ data: { name: "Chinyere Ifekwuku",  email: "chinyere@seed.nutritcare", password: await bcrypt.hash("Pending@123", 10), role: "ACCOUNTANT",        isActive: false, accountActivationStatus: "PENDING" } }),
    prisma.user.create({ data: { name: "Marvelous David",    email: "marvelous@seed.nutritcare",password: await bcrypt.hash("Pending@123", 10), role: "DATA_ANALYST",      isActive: false, accountActivationStatus: "PENDING" } }),
    prisma.user.create({ data: { name: "Inioluwa Grace",     email: "inioluwa@seed.nutritcare", password: await bcrypt.hash("Pending@123", 10), role: "SALES_REP",         isActive: false, accountActivationStatus: "PENDING" } }),
  ]);
  console.log("  ✓ Teams, team leads, and pending activation requests created");

  // ── Product Category ────────────────────────────────────────────────────────
  const category = await prisma.productCategory.create({
    data: {
      categoryName: "Nutricare [SEED]",
      brandName: "Nutricare",
      brandPhone: "+2348012345678",
    },
  });

  // ── Products ────────────────────────────────────────────────────────────────
  const [prosxact, shredBelly, fonioMill, trimTone, neuroBalm, afterNatal, linix] =
    await Promise.all([
      prisma.product.create({ data: { name: "Prosxact",        costPrice: PRICES.prosxact.cost,   sellingPrice: PRICES.prosxact.sell,   sku: "SEED-PRX-001", categoryId: category.id, isActive: true, lowStockAlertQtyTotal: 100 } }),
      prisma.product.create({ data: { name: "Shred Belly",     costPrice: PRICES.shredBelly.cost, sellingPrice: PRICES.shredBelly.sell, sku: "SEED-SHB-002", categoryId: category.id, isActive: true, lowStockAlertQtyTotal: 100 } }),
      prisma.product.create({ data: { name: "Fonio-Mill",      costPrice: PRICES.fonioMill.cost,  sellingPrice: PRICES.fonioMill.sell,  sku: "SEED-FNM-003", categoryId: category.id, isActive: true, lowStockAlertQtyTotal: 100 } }),
      prisma.product.create({ data: { name: "Trim and Tone",   costPrice: PRICES.trimTone.cost,   sellingPrice: PRICES.trimTone.sell,   sku: "SEED-TAT-004", categoryId: category.id, isActive: true, lowStockAlertQtyTotal: 100 } }),
      prisma.product.create({ data: { name: "Neuro-Vive Balm", costPrice: PRICES.neuroBalm.cost,  sellingPrice: PRICES.neuroBalm.sell,  sku: "SEED-NVB-005", categoryId: category.id, isActive: true, lowStockAlertQtyTotal:  50 } }),
      prisma.product.create({ data: { name: "After-Natal",     costPrice: PRICES.afterNatal.cost, sellingPrice: PRICES.afterNatal.sell, sku: "SEED-ATN-006", categoryId: category.id, isActive: true, lowStockAlertQtyTotal: 100 } }),
      prisma.product.create({ data: { name: "Linix",           costPrice: PRICES.linix.cost,      sellingPrice: PRICES.linix.sell,      sku: "SEED-LNX-007", categoryId: category.id, isActive: true, lowStockAlertQtyTotal: 100 } }),
    ]);

  // ── Agents ──────────────────────────────────────────────────────────────────
  const [agentOla, agentQudus, agentSunmi, agentFlymack] = await Promise.all([
    prisma.agent.create({ data: { companyName: "Mr. Ola Logistics",  state: "Lagos State",  phone1: "+2340000111111", status: "ACTIVE", addedById: adminUser.id } }),
    prisma.agent.create({ data: { companyName: "Mr. Qudus Delivery", state: "Lagos State",  phone1: "+2340000222222", status: "ACTIVE", addedById: adminUser.id } }),
    prisma.agent.create({ data: { companyName: "Mrs. Sunmi Express", state: "Oyo State",    phone1: "+2340000333333", status: "ACTIVE", addedById: adminUser.id } }),
    prisma.agent.create({ data: { companyName: "Flymack Couriers",   state: "Kaduna State", phone1: "+2340000444444", status: "ACTIVE", addedById: adminUser.id } }),
  ]);

  // ── Delivery Agent User accounts (linked to Agents for login) ───────────────
  await Promise.all([
    prisma.user.create({ data: { name: "Mr. Ola Logistics",  email: "ola@seed.nutritcare",     password: await bcrypt.hash("Agent@123", 10), role: "DELIVERY_AGENT", phone: "+2340000111111", isActive: true, accountActivationStatus: "APPROVED", agentId: agentOla.id } }),
    prisma.user.create({ data: { name: "Mr. Qudus Delivery", email: "qudus@seed.nutritcare",   password: await bcrypt.hash("Agent@123", 10), role: "DELIVERY_AGENT", phone: "+2340000222222", isActive: true, accountActivationStatus: "APPROVED", agentId: agentQudus.id } }),
    prisma.user.create({ data: { name: "Mrs. Sunmi Express", email: "sunmi@seed.nutritcare",   password: await bcrypt.hash("Agent@123", 10), role: "DELIVERY_AGENT", phone: "+2340000333333", isActive: true, accountActivationStatus: "APPROVED", agentId: agentSunmi.id } }),
    prisma.user.create({ data: { name: "Flymack Couriers",   email: "flymack@seed.nutritcare", password: await bcrypt.hash("Agent@123", 10), role: "DELIVERY_AGENT", phone: "+2340000444444", isActive: true, accountActivationStatus: "APPROVED", agentId: agentFlymack.id } }),
  ]);
  console.log("  ✓ Agents and their linked User accounts created");

  // ── Customers ───────────────────────────────────────────────────────────────
  const [
    adewale, funke, ibrahim, chinedu,
    blessing, sola, halima, victor, samuel,
  ] = await Promise.all([
    prisma.customer.create({ data: { name: "Adewale Johnson",  phone: "+2348023784913", email: "adewale@seed.test",  deliveryAddress: "15 Adeyemi Crescent, Bodija, Ibadan",              state: "Oyo State",    lga: "Ibadan North",  landmark: "Bodija Market", source: "WhatsApp"  } }),
    prisma.customer.create({ data: { name: "Funke Adebayo",    phone: "+2348127746632", email: "funke@seed.test",    deliveryAddress: "22 Opebi Road, Ikeja, Lagos",                       state: "Lagos State",  lga: "Ikeja",         landmark: "Opebi Mall",    source: "WhatsApp"  } }),
    prisma.customer.create({ data: { name: "Ibrahim Musa",     phone: "+2348091185044", email: "ibrahim@seed.test",  deliveryAddress: "7 Constitution Road, Kaduna",                      state: "Kaduna State", lga: "Kaduna North",  landmark: null,            source: "Instagram" } }),
    prisma.customer.create({ data: { name: "Chinedu Okafor",   phone: "+2348034561290", email: "chinedu@seed.test",  deliveryAddress: "4 Trans Amadi Industrial Layout, Port Harcourt",  state: "Rivers State", lga: "Port Harcourt", landmark: null,            source: "WhatsApp"  } }),
    prisma.customer.create({ data: { name: "Blessing Eze",     phone: "+2348034561291", email: "blessing@seed.test", deliveryAddress: "10 New Haven Road, Enugu",                         state: "Enugu State",  lga: "Enugu North",   landmark: null,            source: "Facebook"  } }),
    prisma.customer.create({ data: { name: "Sola Ogunleye",    phone: "+2348034561292", email: "sola@seed.test",     deliveryAddress: "33 Awolowo Road, Ikoyi, Lagos",                   state: "Lagos State",  lga: "Lagos Island",  landmark: null,            source: "WhatsApp"  } }),
    prisma.customer.create({ data: { name: "Halima Abdullahi", phone: "+2348034561293", email: "halima@seed.test",   deliveryAddress: "5 Ahmadu Bello Way, Abuja",                       state: "FCT Abuja",    lga: "Wuse",          landmark: null,            source: "WhatsApp"  } }),
    prisma.customer.create({ data: { name: "Victor Uche",      phone: "+2348034561294", email: "victor@seed.test",   deliveryAddress: "No. 42 Adeoyo Ring Road, Ibadan",                 state: "Oyo State",    lga: "Ibadan North",  landmark: "Near UCH",      source: "WhatsApp"  } }),
    prisma.customer.create({ data: { name: "Samuel Adebayo",   phone: "+2348034561295", email: "samuel@seed.test",   deliveryAddress: "15 Adeyemi Crescent, Bodija Estate, Ibadan",      state: "Oyo State",    lga: "Ibadan North",  landmark: "Bodija Market", source: "Referral"  } }),
  ]);

  // ── Orders ──────────────────────────────────────────────────────────────────
  let seq = 1;
  const num = () => `SEED-ORD-${String(seq++).padStart(4, "0")}`;

  // ═══════════════════════════════════════════════════════════════════
  // MARCH 2026 — last month (12 orders: 7 DELIVERED, 3 FAILED, 2 CANCELLED)
  // ═══════════════════════════════════════════════════════════════════

  // #1 — Adewale: 3× Prosxact — DELIVERED
  {
    const total = PRICES.prosxact.sell * 3;
    const order = await prisma.order.create({ data: {
      orderNumber: num(), customerId: adewale.id, salesRepId: salesRep.id, agentId: agentOla.id,
      status: "DELIVERED", totalAmount: total, netAmount: total, deliveryFee: 1000,
      createdAt: d("2026-03-05T09:00:00Z"),
      items: { create: { productId: prosxact.id, quantity: 3, unitPrice: PRICES.prosxact.sell, lineTotal: total } },
    }});
    await prisma.delivery.create({ data: { orderId: order.id, agentId: agentOla.id, status: "DELIVERED", scheduledTime: d("2026-03-07T10:00:00Z"), deliveredTime: d("2026-03-07T15:00:00Z") } });
  }

  // #2 — Funke: 2× After-Natal — DELIVERED
  {
    const total = PRICES.afterNatal.sell * 2;
    const order = await prisma.order.create({ data: {
      orderNumber: num(), customerId: funke.id, salesRepId: salesRep.id, agentId: agentQudus.id,
      status: "DELIVERED", totalAmount: total, netAmount: total, deliveryFee: 800,
      createdAt: d("2026-03-07T10:00:00Z"),
      items: { create: { productId: afterNatal.id, quantity: 2, unitPrice: PRICES.afterNatal.sell, lineTotal: total } },
    }});
    await prisma.delivery.create({ data: { orderId: order.id, agentId: agentQudus.id, status: "DELIVERED", scheduledTime: d("2026-03-09T09:00:00Z"), deliveredTime: d("2026-03-09T14:00:00Z") } });
  }

  // #3 — Ibrahim: 4× Shred Belly — DELIVERED
  {
    const total = PRICES.shredBelly.sell * 4;
    const order = await prisma.order.create({ data: {
      orderNumber: num(), customerId: ibrahim.id, salesRepId: salesRep.id, agentId: agentFlymack.id,
      status: "DELIVERED", totalAmount: total, netAmount: total, deliveryFee: 2000,
      createdAt: d("2026-03-09T11:00:00Z"),
      items: { create: { productId: shredBelly.id, quantity: 4, unitPrice: PRICES.shredBelly.sell, lineTotal: total } },
    }});
    await prisma.delivery.create({ data: { orderId: order.id, agentId: agentFlymack.id, status: "DELIVERED", scheduledTime: d("2026-03-11T10:00:00Z"), deliveredTime: d("2026-03-11T16:00:00Z") } });
  }

  // #4 — Chinedu: 3× Linix — DELIVERED
  {
    const total = PRICES.linix.sell * 3;
    const order = await prisma.order.create({ data: {
      orderNumber: num(), customerId: chinedu.id, salesRepId: salesRep.id, agentId: agentOla.id,
      status: "DELIVERED", totalAmount: total, netAmount: total, deliveryFee: 1500,
      createdAt: d("2026-03-11T08:30:00Z"),
      items: { create: { productId: linix.id, quantity: 3, unitPrice: PRICES.linix.sell, lineTotal: total } },
    }});
    await prisma.delivery.create({ data: { orderId: order.id, agentId: agentOla.id, status: "DELIVERED", scheduledTime: d("2026-03-13T09:00:00Z"), deliveredTime: d("2026-03-13T14:30:00Z") } });
  }

  // #5 — Blessing: 2× Neuro-Vive Balm — DELIVERED
  {
    const total = PRICES.neuroBalm.sell * 2;
    const order = await prisma.order.create({ data: {
      orderNumber: num(), customerId: blessing.id, salesRepId: salesRep.id, agentId: agentSunmi.id,
      status: "DELIVERED", totalAmount: total, netAmount: total, deliveryFee: 1200,
      createdAt: d("2026-03-13T10:00:00Z"),
      items: { create: { productId: neuroBalm.id, quantity: 2, unitPrice: PRICES.neuroBalm.sell, lineTotal: total } },
    }});
    await prisma.delivery.create({ data: { orderId: order.id, agentId: agentSunmi.id, status: "DELIVERED", scheduledTime: d("2026-03-15T10:00:00Z"), deliveredTime: d("2026-03-15T13:00:00Z") } });
  }

  // #6 — Sola: 5× Trim and Tone — DELIVERED
  {
    const total = PRICES.trimTone.sell * 5;
    const order = await prisma.order.create({ data: {
      orderNumber: num(), customerId: sola.id, salesRepId: salesRep.id, agentId: agentQudus.id,
      status: "DELIVERED", totalAmount: total, netAmount: total, deliveryFee: 1800,
      createdAt: d("2026-03-15T09:00:00Z"),
      items: { create: { productId: trimTone.id, quantity: 5, unitPrice: PRICES.trimTone.sell, lineTotal: total } },
    }});
    await prisma.delivery.create({ data: { orderId: order.id, agentId: agentQudus.id, status: "DELIVERED", scheduledTime: d("2026-03-17T10:00:00Z"), deliveredTime: d("2026-03-17T15:00:00Z") } });
  }

  // #7 — Victor: 2× Prosxact + 1× After-Natal — DELIVERED (multi-item, upsell)
  {
    const p1 = PRICES.prosxact.sell * 2;
    const p2 = PRICES.afterNatal.sell * 1;
    const total = p1 + p2;
    const order = await prisma.order.create({ data: {
      orderNumber: num(), customerId: victor.id, salesRepId: salesRep.id, agentId: agentFlymack.id,
      status: "DELIVERED", totalAmount: total, netAmount: total, deliveryFee: 1000,
      createdAt: d("2026-03-17T11:00:00Z"),
      items: { create: [
        { productId: prosxact.id,   quantity: 2, unitPrice: PRICES.prosxact.sell,   lineTotal: p1 },
        { productId: afterNatal.id, quantity: 1, unitPrice: PRICES.afterNatal.sell, lineTotal: p2 },
      ]},
    }});
    await prisma.delivery.create({ data: { orderId: order.id, agentId: agentFlymack.id, status: "DELIVERED", scheduledTime: d("2026-03-19T10:00:00Z"), deliveredTime: d("2026-03-19T14:00:00Z") } });
  }

  // #8 — Samuel: 3× Shred Belly — FAILED
  {
    const total = PRICES.shredBelly.sell * 3;
    const order = await prisma.order.create({ data: {
      orderNumber: num(), customerId: samuel.id, salesRepId: salesRep.id, agentId: agentOla.id,
      status: "FAILED", totalAmount: total, netAmount: total, deliveryFee: 1000,
      createdAt: d("2026-03-19T09:00:00Z"),
      items: { create: { productId: shredBelly.id, quantity: 3, unitPrice: PRICES.shredBelly.sell, lineTotal: total } },
    }});
    await prisma.delivery.create({ data: { orderId: order.id, agentId: agentOla.id, status: "FAILED", failureReason: "Customer unreachable", scheduledTime: d("2026-03-21T10:00:00Z") } });
  }

  // #9 — Halima: 2× Fonio-Mill — FAILED
  {
    const total = PRICES.fonioMill.sell * 2;
    const order = await prisma.order.create({ data: {
      orderNumber: num(), customerId: halima.id, salesRepId: salesRep.id, agentId: agentSunmi.id,
      status: "FAILED", totalAmount: total, netAmount: total, deliveryFee: 1200,
      createdAt: d("2026-03-21T10:00:00Z"),
      items: { create: { productId: fonioMill.id, quantity: 2, unitPrice: PRICES.fonioMill.sell, lineTotal: total } },
    }});
    await prisma.delivery.create({ data: { orderId: order.id, agentId: agentSunmi.id, status: "FAILED", failureReason: "Wrong address", scheduledTime: d("2026-03-23T09:00:00Z") } });
  }

  // #10 — Adewale: 1× Neuro-Vive Balm — FAILED
  {
    const total = PRICES.neuroBalm.sell;
    const order = await prisma.order.create({ data: {
      orderNumber: num(), customerId: adewale.id, salesRepId: salesRep.id, agentId: agentQudus.id,
      status: "FAILED", totalAmount: total, netAmount: total, deliveryFee: 800,
      createdAt: d("2026-03-22T11:00:00Z"),
      items: { create: { productId: neuroBalm.id, quantity: 1, unitPrice: PRICES.neuroBalm.sell, lineTotal: total } },
    }});
    await prisma.delivery.create({ data: { orderId: order.id, agentId: agentQudus.id, status: "FAILED", failureReason: "Customer cancelled at door", scheduledTime: d("2026-03-24T10:00:00Z") } });
  }

  // #11 — Funke: 4× Prosxact — CANCELLED
  {
    const total = PRICES.prosxact.sell * 4;
    await prisma.order.create({ data: {
      orderNumber: num(), customerId: funke.id, salesRepId: salesRep.id,
      status: "CANCELLED", totalAmount: total, netAmount: total, deliveryFee: 0,
      createdAt: d("2026-03-24T09:00:00Z"),
      items: { create: { productId: prosxact.id, quantity: 4, unitPrice: PRICES.prosxact.sell, lineTotal: total } },
    }});
  }

  // #12 — Ibrahim: 2× Linix — CANCELLED
  {
    const total = PRICES.linix.sell * 2;
    await prisma.order.create({ data: {
      orderNumber: num(), customerId: ibrahim.id, salesRepId: salesRep.id,
      status: "CANCELLED", totalAmount: total, netAmount: total, deliveryFee: 0,
      createdAt: d("2026-03-26T10:00:00Z"),
      items: { create: { productId: linix.id, quantity: 2, unitPrice: PRICES.linix.sell, lineTotal: total } },
    }});
  }

  // ═══════════════════════════════════════════════════════════════════
  // APRIL 2026 — current month (15 orders)
  // Original 10 orders (kept as-is, createdAt defaults to now/April)
  // ═══════════════════════════════════════════════════════════════════

  // #13 — Adewale: 3× Prosxact — PENDING
  {
    const total = PRICES.prosxact.sell * 3;
    await prisma.order.create({ data: {
      orderNumber: num(), customerId: adewale.id, salesRepId: salesRep.id,
      status: "PENDING", totalAmount: total, netAmount: total, deliveryFee: 0,
      createdAt: d("2026-04-01T09:00:00Z"),
      items: { create: { productId: prosxact.id, quantity: 3, unitPrice: PRICES.prosxact.sell, lineTotal: total } },
    }});
  }

  // #14 — Funke: 2× Shred Belly — PENDING
  {
    const total = PRICES.shredBelly.sell * 2;
    await prisma.order.create({ data: {
      orderNumber: num(), customerId: funke.id, salesRepId: salesRep.id,
      status: "PENDING", totalAmount: total, netAmount: total, deliveryFee: 0,
      createdAt: d("2026-04-02T10:00:00Z"),
      items: { create: { productId: shredBelly.id, quantity: 2, unitPrice: PRICES.shredBelly.sell, lineTotal: total } },
    }});
  }

  // #15 — Sola: 3× Prosxact + 1× Shred Belly — PENDING (multi-item)
  {
    const p1 = PRICES.prosxact.sell * 3;
    const p2 = PRICES.shredBelly.sell;
    const total = p1 + p2;
    await prisma.order.create({ data: {
      orderNumber: num(), customerId: sola.id, salesRepId: salesRep.id,
      status: "PENDING", totalAmount: total, netAmount: total, deliveryFee: 0,
      createdAt: d("2026-04-03T11:00:00Z"),
      items: { create: [
        { productId: prosxact.id,   quantity: 3, unitPrice: PRICES.prosxact.sell,   lineTotal: p1 },
        { productId: shredBelly.id, quantity: 1, unitPrice: PRICES.shredBelly.sell, lineTotal: p2 },
      ]},
    }});
  }

  // #16 — Victor: 6× Shred Belly — PENDING
  {
    const total = PRICES.shredBelly.sell * 6;
    await prisma.order.create({ data: {
      orderNumber: num(), customerId: victor.id, salesRepId: salesRep.id,
      status: "PENDING", totalAmount: total, netAmount: total, deliveryFee: 0,
      createdAt: d("2026-04-04T09:30:00Z"),
      items: { create: { productId: shredBelly.id, quantity: 6, unitPrice: PRICES.shredBelly.sell, lineTotal: total } },
    }});
  }

  // #17 — Chinedu: 4× Trim and Tone — CONFIRMED
  {
    const total = PRICES.trimTone.sell * 4;
    await prisma.order.create({ data: {
      orderNumber: num(), customerId: chinedu.id, salesRepId: salesRep.id, agentId: agentQudus.id,
      status: "CONFIRMED", totalAmount: total, netAmount: total, deliveryFee: 2025,
      createdAt: d("2026-04-05T10:00:00Z"),
      items: { create: { productId: trimTone.id, quantity: 4, unitPrice: PRICES.trimTone.sell, lineTotal: total } },
    }});
  }

  // #18 — Halima: 6× Shred Belly — CONFIRMED
  {
    const total = PRICES.shredBelly.sell * 6;
    await prisma.order.create({ data: {
      orderNumber: num(), customerId: halima.id, salesRepId: salesRep.id, agentId: agentSunmi.id,
      status: "CONFIRMED", totalAmount: total, netAmount: total, deliveryFee: 1500,
      createdAt: d("2026-04-06T11:00:00Z"),
      items: { create: { productId: shredBelly.id, quantity: 6, unitPrice: PRICES.shredBelly.sell, lineTotal: total } },
    }});
  }

  // #19 — Samuel: 2× Prosxact — DELIVERED
  {
    const total = PRICES.prosxact.sell * 2;
    const order = await prisma.order.create({ data: {
      orderNumber: num(), customerId: samuel.id, salesRepId: salesRep.id, agentId: agentFlymack.id,
      status: "DELIVERED", totalAmount: total, netAmount: total, deliveryFee: 1000,
      createdAt: d("2026-04-07T09:00:00Z"),
      items: { create: { productId: prosxact.id, quantity: 2, unitPrice: PRICES.prosxact.sell, lineTotal: total } },
    }});
    await prisma.delivery.create({ data: { orderId: order.id, agentId: agentFlymack.id, status: "DELIVERED", scheduledTime: d("2026-04-09T10:00:00Z"), deliveredTime: d("2026-04-09T16:45:00Z") } });
  }

  // #20 — Adewale: 1× Prosxact + 2× Fonio-Mill — DELIVERED (multi-item)
  {
    const p1 = PRICES.prosxact.sell;
    const p2 = PRICES.fonioMill.sell * 2;
    const total = p1 + p2;
    const order = await prisma.order.create({ data: {
      orderNumber: num(), customerId: adewale.id, salesRepId: salesRep.id, agentId: agentOla.id,
      status: "DELIVERED", totalAmount: total, netAmount: total, deliveryFee: 1200,
      createdAt: d("2026-04-08T10:00:00Z"),
      items: { create: [
        { productId: prosxact.id,  quantity: 1, unitPrice: PRICES.prosxact.sell,  lineTotal: p1 },
        { productId: fonioMill.id, quantity: 2, unitPrice: PRICES.fonioMill.sell, lineTotal: p2 },
      ]},
    }});
    await prisma.delivery.create({ data: { orderId: order.id, agentId: agentOla.id, status: "DELIVERED", scheduledTime: d("2026-04-10T09:00:00Z"), deliveredTime: d("2026-04-10T14:30:00Z") } });
  }

  // #21 — Blessing: 1× Neuro-Vive Balm — CANCELLED
  {
    const total = PRICES.neuroBalm.sell;
    await prisma.order.create({ data: {
      orderNumber: num(), customerId: blessing.id, salesRepId: salesRep.id,
      status: "CANCELLED", totalAmount: total, netAmount: total, deliveryFee: 0,
      createdAt: d("2026-04-09T09:00:00Z"),
      items: { create: { productId: neuroBalm.id, quantity: 1, unitPrice: PRICES.neuroBalm.sell, lineTotal: total } },
    }});
  }

  // #22 — Ibrahim: 5× Fonio-Mill — FAILED
  {
    const total = PRICES.fonioMill.sell * 5;
    const order = await prisma.order.create({ data: {
      orderNumber: num(), customerId: ibrahim.id, salesRepId: salesRep.id, agentId: agentOla.id,
      status: "FAILED", totalAmount: total, netAmount: total, deliveryFee: 2000,
      createdAt: d("2026-04-10T10:00:00Z"),
      items: { create: { productId: fonioMill.id, quantity: 5, unitPrice: PRICES.fonioMill.sell, lineTotal: total } },
    }});
    await prisma.delivery.create({ data: { orderId: order.id, agentId: agentOla.id, status: "FAILED", failureReason: "Customer not available", scheduledTime: d("2026-04-12T10:00:00Z") } });
  }

  // #23 — Chinedu: 2× After-Natal — DELIVERED
  {
    const total = PRICES.afterNatal.sell * 2;
    const order = await prisma.order.create({ data: {
      orderNumber: num(), customerId: chinedu.id, salesRepId: salesRep.id, agentId: agentQudus.id,
      status: "DELIVERED", totalAmount: total, netAmount: total, deliveryFee: 1000,
      createdAt: d("2026-04-11T09:00:00Z"),
      items: { create: { productId: afterNatal.id, quantity: 2, unitPrice: PRICES.afterNatal.sell, lineTotal: total } },
    }});
    await prisma.delivery.create({ data: { orderId: order.id, agentId: agentQudus.id, status: "DELIVERED", scheduledTime: d("2026-04-13T10:00:00Z"), deliveredTime: d("2026-04-13T14:00:00Z") } });
  }

  // #24 — Blessing: 3× Linix + 1× Shred Belly — DELIVERED (multi-item, upsell)
  {
    const p1 = PRICES.linix.sell * 3;
    const p2 = PRICES.shredBelly.sell;
    const total = p1 + p2;
    const order = await prisma.order.create({ data: {
      orderNumber: num(), customerId: blessing.id, salesRepId: salesRep.id, agentId: agentSunmi.id,
      status: "DELIVERED", totalAmount: total, netAmount: total, deliveryFee: 1200,
      createdAt: d("2026-04-13T10:00:00Z"),
      items: { create: [
        { productId: linix.id,      quantity: 3, unitPrice: PRICES.linix.sell,      lineTotal: p1 },
        { productId: shredBelly.id, quantity: 1, unitPrice: PRICES.shredBelly.sell, lineTotal: p2 },
      ]},
    }});
    await prisma.delivery.create({ data: { orderId: order.id, agentId: agentSunmi.id, status: "DELIVERED", scheduledTime: d("2026-04-15T09:00:00Z"), deliveredTime: d("2026-04-15T13:00:00Z") } });
  }

  // #25 — Sola: 4× Prosxact — FAILED
  {
    const total = PRICES.prosxact.sell * 4;
    const order = await prisma.order.create({ data: {
      orderNumber: num(), customerId: sola.id, salesRepId: salesRep.id, agentId: agentFlymack.id,
      status: "FAILED", totalAmount: total, netAmount: total, deliveryFee: 1500,
      createdAt: d("2026-04-14T11:00:00Z"),
      items: { create: { productId: prosxact.id, quantity: 4, unitPrice: PRICES.prosxact.sell, lineTotal: total } },
    }});
    await prisma.delivery.create({ data: { orderId: order.id, agentId: agentFlymack.id, status: "FAILED", failureReason: "Address not found", scheduledTime: d("2026-04-16T10:00:00Z") } });
  }

  // #26 — Victor: 2× Neuro-Vive Balm — CANCELLED
  {
    const total = PRICES.neuroBalm.sell * 2;
    await prisma.order.create({ data: {
      orderNumber: num(), customerId: victor.id, salesRepId: salesRep.id,
      status: "CANCELLED", totalAmount: total, netAmount: total, deliveryFee: 0,
      createdAt: d("2026-04-15T09:00:00Z"),
      items: { create: { productId: neuroBalm.id, quantity: 2, unitPrice: PRICES.neuroBalm.sell, lineTotal: total } },
    }});
  }

  // #27 — Samuel: 1× Trim and Tone + 2× After-Natal — DELIVERED (multi-item, upsell)
  {
    const p1 = PRICES.trimTone.sell;
    const p2 = PRICES.afterNatal.sell * 2;
    const total = p1 + p2;
    const order = await prisma.order.create({ data: {
      orderNumber: num(), customerId: samuel.id, salesRepId: salesRep.id, agentId: agentOla.id,
      status: "DELIVERED", totalAmount: total, netAmount: total, deliveryFee: 1000,
      createdAt: d("2026-04-18T10:00:00Z"),
      items: { create: [
        { productId: trimTone.id,   quantity: 1, unitPrice: PRICES.trimTone.sell,   lineTotal: p1 },
        { productId: afterNatal.id, quantity: 2, unitPrice: PRICES.afterNatal.sell, lineTotal: p2 },
      ]},
    }});
    await prisma.delivery.create({ data: { orderId: order.id, agentId: agentOla.id, status: "DELIVERED", scheduledTime: d("2026-04-20T10:00:00Z"), deliveredTime: d("2026-04-20T15:00:00Z") } });
  }

  // ═══════════════════════════════════════════════════════════════════
  // CHIAMAKA OKORIE — March 2026 (5 DELIVERED, 1 FAILED, 1 CANCELLED)
  // ═══════════════════════════════════════════════════════════════════

  // #28 — Adewale: 2× Prosxact — DELIVERED
  { const total = PRICES.prosxact.sell * 2;
    const order = await prisma.order.create({ data: { orderNumber: num(), customerId: adewale.id, salesRepId: chiamaka.id, agentId: agentQudus.id, status: "DELIVERED", totalAmount: total, netAmount: total, deliveryFee: 1000, createdAt: d("2026-03-06T09:00:00Z"), items: { create: { productId: prosxact.id, quantity: 2, unitPrice: PRICES.prosxact.sell, lineTotal: total } } } });
    await prisma.delivery.create({ data: { orderId: order.id, agentId: agentQudus.id, status: "DELIVERED", scheduledTime: d("2026-03-08T10:00:00Z"), deliveredTime: d("2026-03-08T15:00:00Z") } }); }

  // #29 — Funke: 3× Shred Belly — DELIVERED
  { const total = PRICES.shredBelly.sell * 3;
    const order = await prisma.order.create({ data: { orderNumber: num(), customerId: funke.id, salesRepId: chiamaka.id, agentId: agentOla.id, status: "DELIVERED", totalAmount: total, netAmount: total, deliveryFee: 1000, createdAt: d("2026-03-08T10:00:00Z"), items: { create: { productId: shredBelly.id, quantity: 3, unitPrice: PRICES.shredBelly.sell, lineTotal: total } } } });
    await prisma.delivery.create({ data: { orderId: order.id, agentId: agentOla.id, status: "DELIVERED", scheduledTime: d("2026-03-10T09:00:00Z"), deliveredTime: d("2026-03-10T14:00:00Z") } }); }

  // #30 — Chinedu: 4× Trim and Tone + 1× Linix — DELIVERED (upsell)
  { const p1 = PRICES.trimTone.sell * 4; const p2 = PRICES.linix.sell; const total = p1 + p2;
    const order = await prisma.order.create({ data: { orderNumber: num(), customerId: chinedu.id, salesRepId: chiamaka.id, agentId: agentFlymack.id, status: "DELIVERED", totalAmount: total, netAmount: total, deliveryFee: 1500, createdAt: d("2026-03-12T11:00:00Z"), items: { create: [{ productId: trimTone.id, quantity: 4, unitPrice: PRICES.trimTone.sell, lineTotal: p1 }, { productId: linix.id, quantity: 1, unitPrice: PRICES.linix.sell, lineTotal: p2 }] } } });
    await prisma.delivery.create({ data: { orderId: order.id, agentId: agentFlymack.id, status: "DELIVERED", scheduledTime: d("2026-03-14T10:00:00Z"), deliveredTime: d("2026-03-14T15:00:00Z") } }); }

  // #31 — Halima: 2× After-Natal — DELIVERED
  { const total = PRICES.afterNatal.sell * 2;
    const order = await prisma.order.create({ data: { orderNumber: num(), customerId: halima.id, salesRepId: chiamaka.id, agentId: agentSunmi.id, status: "DELIVERED", totalAmount: total, netAmount: total, deliveryFee: 1200, createdAt: d("2026-03-16T09:00:00Z"), items: { create: { productId: afterNatal.id, quantity: 2, unitPrice: PRICES.afterNatal.sell, lineTotal: total } } } });
    await prisma.delivery.create({ data: { orderId: order.id, agentId: agentSunmi.id, status: "DELIVERED", scheduledTime: d("2026-03-18T09:00:00Z"), deliveredTime: d("2026-03-18T14:00:00Z") } }); }

  // #32 — Victor: 3× Neuro-Vive Balm — DELIVERED
  { const total = PRICES.neuroBalm.sell * 3;
    const order = await prisma.order.create({ data: { orderNumber: num(), customerId: victor.id, salesRepId: chiamaka.id, agentId: agentOla.id, status: "DELIVERED", totalAmount: total, netAmount: total, deliveryFee: 1000, createdAt: d("2026-03-20T10:00:00Z"), items: { create: { productId: neuroBalm.id, quantity: 3, unitPrice: PRICES.neuroBalm.sell, lineTotal: total } } } });
    await prisma.delivery.create({ data: { orderId: order.id, agentId: agentOla.id, status: "DELIVERED", scheduledTime: d("2026-03-22T09:00:00Z"), deliveredTime: d("2026-03-22T13:00:00Z") } }); }

  // #33 — Sola: 2× Fonio-Mill — FAILED
  { const total = PRICES.fonioMill.sell * 2;
    const order = await prisma.order.create({ data: { orderNumber: num(), customerId: sola.id, salesRepId: chiamaka.id, agentId: agentQudus.id, status: "FAILED", totalAmount: total, netAmount: total, deliveryFee: 1000, createdAt: d("2026-03-23T09:00:00Z"), items: { create: { productId: fonioMill.id, quantity: 2, unitPrice: PRICES.fonioMill.sell, lineTotal: total } } } });
    await prisma.delivery.create({ data: { orderId: order.id, agentId: agentQudus.id, status: "FAILED", failureReason: "Customer not available", scheduledTime: d("2026-03-25T10:00:00Z") } }); }

  // #34 — Samuel: 3× Prosxact — CANCELLED
  { const total = PRICES.prosxact.sell * 3;
    await prisma.order.create({ data: { orderNumber: num(), customerId: samuel.id, salesRepId: chiamaka.id, status: "CANCELLED", totalAmount: total, netAmount: total, deliveryFee: 0, createdAt: d("2026-03-27T09:00:00Z"), items: { create: { productId: prosxact.id, quantity: 3, unitPrice: PRICES.prosxact.sell, lineTotal: total } } } }); }

  // CHIAMAKA — April 2026 (2 DELIVERED, 2 CONFIRMED, 1 PENDING)

  // #35 — Adewale: 1× Prosxact + 2× Fonio-Mill — DELIVERED (upsell)
  { const p1 = PRICES.prosxact.sell; const p2 = PRICES.fonioMill.sell * 2; const total = p1 + p2;
    const order = await prisma.order.create({ data: { orderNumber: num(), customerId: adewale.id, salesRepId: chiamaka.id, agentId: agentQudus.id, status: "DELIVERED", totalAmount: total, netAmount: total, deliveryFee: 1200, createdAt: d("2026-04-05T09:00:00Z"), items: { create: [{ productId: prosxact.id, quantity: 1, unitPrice: PRICES.prosxact.sell, lineTotal: p1 }, { productId: fonioMill.id, quantity: 2, unitPrice: PRICES.fonioMill.sell, lineTotal: p2 }] } } });
    await prisma.delivery.create({ data: { orderId: order.id, agentId: agentQudus.id, status: "DELIVERED", scheduledTime: d("2026-04-07T10:00:00Z"), deliveredTime: d("2026-04-07T15:00:00Z") } }); }

  // #36 — Blessing: 4× Shred Belly — DELIVERED
  { const total = PRICES.shredBelly.sell * 4;
    const order = await prisma.order.create({ data: { orderNumber: num(), customerId: blessing.id, salesRepId: chiamaka.id, agentId: agentSunmi.id, status: "DELIVERED", totalAmount: total, netAmount: total, deliveryFee: 1200, createdAt: d("2026-04-09T09:00:00Z"), items: { create: { productId: shredBelly.id, quantity: 4, unitPrice: PRICES.shredBelly.sell, lineTotal: total } } } });
    await prisma.delivery.create({ data: { orderId: order.id, agentId: agentSunmi.id, status: "DELIVERED", scheduledTime: d("2026-04-11T09:00:00Z"), deliveredTime: d("2026-04-11T14:00:00Z") } }); }

  // #37 — Victor: 3× Trim and Tone — CONFIRMED
  { const total = PRICES.trimTone.sell * 3;
    await prisma.order.create({ data: { orderNumber: num(), customerId: victor.id, salesRepId: chiamaka.id, agentId: agentOla.id, status: "CONFIRMED", totalAmount: total, netAmount: total, deliveryFee: 1500, createdAt: d("2026-04-15T10:00:00Z"), items: { create: { productId: trimTone.id, quantity: 3, unitPrice: PRICES.trimTone.sell, lineTotal: total } } } }); }

  // #38 — Chinedu: 2× After-Natal — CONFIRMED
  { const total = PRICES.afterNatal.sell * 2;
    await prisma.order.create({ data: { orderNumber: num(), customerId: chinedu.id, salesRepId: chiamaka.id, agentId: agentFlymack.id, status: "CONFIRMED", totalAmount: total, netAmount: total, deliveryFee: 1000, createdAt: d("2026-04-18T10:00:00Z"), items: { create: { productId: afterNatal.id, quantity: 2, unitPrice: PRICES.afterNatal.sell, lineTotal: total } } } }); }

  // #39 — Ibrahim: 5× Linix — PENDING
  { const total = PRICES.linix.sell * 5;
    await prisma.order.create({ data: { orderNumber: num(), customerId: ibrahim.id, salesRepId: chiamaka.id, status: "PENDING", totalAmount: total, netAmount: total, deliveryFee: 0, createdAt: d("2026-04-21T09:00:00Z"), items: { create: { productId: linix.id, quantity: 5, unitPrice: PRICES.linix.sell, lineTotal: total } } } }); }

  // ═══════════════════════════════════════════════════════════════════
  // BLESSING EHIJIE — March 2026 (4 DELIVERED, 1 FAILED, 1 CANCELLED)
  // ═══════════════════════════════════════════════════════════════════

  // #40 — Halima: 3× Prosxact — DELIVERED
  { const total = PRICES.prosxact.sell * 3;
    const order = await prisma.order.create({ data: { orderNumber: num(), customerId: halima.id, salesRepId: blessingE.id, agentId: agentSunmi.id, status: "DELIVERED", totalAmount: total, netAmount: total, deliveryFee: 1200, createdAt: d("2026-03-07T09:00:00Z"), items: { create: { productId: prosxact.id, quantity: 3, unitPrice: PRICES.prosxact.sell, lineTotal: total } } } });
    await prisma.delivery.create({ data: { orderId: order.id, agentId: agentSunmi.id, status: "DELIVERED", scheduledTime: d("2026-03-09T09:00:00Z"), deliveredTime: d("2026-03-09T15:00:00Z") } }); }

  // #41 — Samuel: 2× After-Natal + 1× Neuro-Vive Balm — DELIVERED (upsell)
  { const p1 = PRICES.afterNatal.sell * 2; const p2 = PRICES.neuroBalm.sell; const total = p1 + p2;
    const order = await prisma.order.create({ data: { orderNumber: num(), customerId: samuel.id, salesRepId: blessingE.id, agentId: agentFlymack.id, status: "DELIVERED", totalAmount: total, netAmount: total, deliveryFee: 1500, createdAt: d("2026-03-11T10:00:00Z"), items: { create: [{ productId: afterNatal.id, quantity: 2, unitPrice: PRICES.afterNatal.sell, lineTotal: p1 }, { productId: neuroBalm.id, quantity: 1, unitPrice: PRICES.neuroBalm.sell, lineTotal: p2 }] } } });
    await prisma.delivery.create({ data: { orderId: order.id, agentId: agentFlymack.id, status: "DELIVERED", scheduledTime: d("2026-03-13T10:00:00Z"), deliveredTime: d("2026-03-13T14:00:00Z") } }); }

  // #42 — Adewale: 4× Shred Belly — DELIVERED
  { const total = PRICES.shredBelly.sell * 4;
    const order = await prisma.order.create({ data: { orderNumber: num(), customerId: adewale.id, salesRepId: blessingE.id, agentId: agentOla.id, status: "DELIVERED", totalAmount: total, netAmount: total, deliveryFee: 1000, createdAt: d("2026-03-14T09:00:00Z"), items: { create: { productId: shredBelly.id, quantity: 4, unitPrice: PRICES.shredBelly.sell, lineTotal: total } } } });
    await prisma.delivery.create({ data: { orderId: order.id, agentId: agentOla.id, status: "DELIVERED", scheduledTime: d("2026-03-16T10:00:00Z"), deliveredTime: d("2026-03-16T14:00:00Z") } }); }

  // #43 — Funke: 2× Trim and Tone — DELIVERED
  { const total = PRICES.trimTone.sell * 2;
    const order = await prisma.order.create({ data: { orderNumber: num(), customerId: funke.id, salesRepId: blessingE.id, agentId: agentQudus.id, status: "DELIVERED", totalAmount: total, netAmount: total, deliveryFee: 1000, createdAt: d("2026-03-18T10:00:00Z"), items: { create: { productId: trimTone.id, quantity: 2, unitPrice: PRICES.trimTone.sell, lineTotal: total } } } });
    await prisma.delivery.create({ data: { orderId: order.id, agentId: agentQudus.id, status: "DELIVERED", scheduledTime: d("2026-03-20T10:00:00Z"), deliveredTime: d("2026-03-20T15:00:00Z") } }); }

  // #44 — Ibrahim: 3× Linix — FAILED
  { const total = PRICES.linix.sell * 3;
    const order = await prisma.order.create({ data: { orderNumber: num(), customerId: ibrahim.id, salesRepId: blessingE.id, agentId: agentFlymack.id, status: "FAILED", totalAmount: total, netAmount: total, deliveryFee: 1500, createdAt: d("2026-03-22T09:00:00Z"), items: { create: { productId: linix.id, quantity: 3, unitPrice: PRICES.linix.sell, lineTotal: total } } } });
    await prisma.delivery.create({ data: { orderId: order.id, agentId: agentFlymack.id, status: "FAILED", failureReason: "Wrong address", scheduledTime: d("2026-03-24T10:00:00Z") } }); }

  // #45 — Chinedu: 2× Fonio-Mill — CANCELLED
  { const total = PRICES.fonioMill.sell * 2;
    await prisma.order.create({ data: { orderNumber: num(), customerId: chinedu.id, salesRepId: blessingE.id, status: "CANCELLED", totalAmount: total, netAmount: total, deliveryFee: 0, createdAt: d("2026-03-25T09:00:00Z"), items: { create: { productId: fonioMill.id, quantity: 2, unitPrice: PRICES.fonioMill.sell, lineTotal: total } } } }); }

  // BLESSING EHIJIE — April 2026 (1 DELIVERED, 2 CONFIRMED, 2 PENDING)

  // #46 — Sola: 2× Prosxact + 1× After-Natal — DELIVERED (upsell)
  { const p1 = PRICES.prosxact.sell * 2; const p2 = PRICES.afterNatal.sell; const total = p1 + p2;
    const order = await prisma.order.create({ data: { orderNumber: num(), customerId: sola.id, salesRepId: blessingE.id, agentId: agentQudus.id, status: "DELIVERED", totalAmount: total, netAmount: total, deliveryFee: 1000, createdAt: d("2026-04-06T09:00:00Z"), items: { create: [{ productId: prosxact.id, quantity: 2, unitPrice: PRICES.prosxact.sell, lineTotal: p1 }, { productId: afterNatal.id, quantity: 1, unitPrice: PRICES.afterNatal.sell, lineTotal: p2 }] } } });
    await prisma.delivery.create({ data: { orderId: order.id, agentId: agentQudus.id, status: "DELIVERED", scheduledTime: d("2026-04-08T09:00:00Z"), deliveredTime: d("2026-04-08T14:00:00Z") } }); }

  // #47 — Victor: 3× Neuro-Vive Balm — CONFIRMED
  { const total = PRICES.neuroBalm.sell * 3;
    await prisma.order.create({ data: { orderNumber: num(), customerId: victor.id, salesRepId: blessingE.id, agentId: agentOla.id, status: "CONFIRMED", totalAmount: total, netAmount: total, deliveryFee: 1000, createdAt: d("2026-04-14T10:00:00Z"), items: { create: { productId: neuroBalm.id, quantity: 3, unitPrice: PRICES.neuroBalm.sell, lineTotal: total } } } }); }

  // #48 — Halima: 4× Shred Belly — CONFIRMED
  { const total = PRICES.shredBelly.sell * 4;
    await prisma.order.create({ data: { orderNumber: num(), customerId: halima.id, salesRepId: blessingE.id, agentId: agentSunmi.id, status: "CONFIRMED", totalAmount: total, netAmount: total, deliveryFee: 1200, createdAt: d("2026-04-17T10:00:00Z"), items: { create: { productId: shredBelly.id, quantity: 4, unitPrice: PRICES.shredBelly.sell, lineTotal: total } } } }); }

  // #49 — Funke: 2× Linix — PENDING
  { const total = PRICES.linix.sell * 2;
    await prisma.order.create({ data: { orderNumber: num(), customerId: funke.id, salesRepId: blessingE.id, status: "PENDING", totalAmount: total, netAmount: total, deliveryFee: 0, createdAt: d("2026-04-20T09:00:00Z"), items: { create: { productId: linix.id, quantity: 2, unitPrice: PRICES.linix.sell, lineTotal: total } } } }); }

  // #50 — Samuel: 3× Trim and Tone — PENDING
  { const total = PRICES.trimTone.sell * 3;
    await prisma.order.create({ data: { orderNumber: num(), customerId: samuel.id, salesRepId: blessingE.id, status: "PENDING", totalAmount: total, netAmount: total, deliveryFee: 0, createdAt: d("2026-04-22T10:00:00Z"), items: { create: { productId: trimTone.id, quantity: 3, unitPrice: PRICES.trimTone.sell, lineTotal: total } } } }); }

  // ═══════════════════════════════════════════════════════════════════
  // EMEKA NWANKWO — March 2026 (2 DELIVERED, 2 FAILED, 1 CANCELLED)
  // ═══════════════════════════════════════════════════════════════════

  // #51 — Blessing: 2× Prosxact — DELIVERED
  { const total = PRICES.prosxact.sell * 2;
    const order = await prisma.order.create({ data: { orderNumber: num(), customerId: blessing.id, salesRepId: emeka.id, agentId: agentOla.id, status: "DELIVERED", totalAmount: total, netAmount: total, deliveryFee: 1000, createdAt: d("2026-03-10T09:00:00Z"), items: { create: { productId: prosxact.id, quantity: 2, unitPrice: PRICES.prosxact.sell, lineTotal: total } } } });
    await prisma.delivery.create({ data: { orderId: order.id, agentId: agentOla.id, status: "DELIVERED", scheduledTime: d("2026-03-12T10:00:00Z"), deliveredTime: d("2026-03-12T15:00:00Z") } }); }

  // #52 — Sola: 3× Shred Belly + 1× Fonio-Mill — DELIVERED (upsell)
  { const p1 = PRICES.shredBelly.sell * 3; const p2 = PRICES.fonioMill.sell; const total = p1 + p2;
    const order = await prisma.order.create({ data: { orderNumber: num(), customerId: sola.id, salesRepId: emeka.id, agentId: agentQudus.id, status: "DELIVERED", totalAmount: total, netAmount: total, deliveryFee: 1000, createdAt: d("2026-03-15T10:00:00Z"), items: { create: [{ productId: shredBelly.id, quantity: 3, unitPrice: PRICES.shredBelly.sell, lineTotal: p1 }, { productId: fonioMill.id, quantity: 1, unitPrice: PRICES.fonioMill.sell, lineTotal: p2 }] } } });
    await prisma.delivery.create({ data: { orderId: order.id, agentId: agentQudus.id, status: "DELIVERED", scheduledTime: d("2026-03-17T09:00:00Z"), deliveredTime: d("2026-03-17T13:00:00Z") } }); }

  // #53 — Chinedu: 4× After-Natal — FAILED
  { const total = PRICES.afterNatal.sell * 4;
    const order = await prisma.order.create({ data: { orderNumber: num(), customerId: chinedu.id, salesRepId: emeka.id, agentId: agentFlymack.id, status: "FAILED", totalAmount: total, netAmount: total, deliveryFee: 2000, createdAt: d("2026-03-18T10:00:00Z"), items: { create: { productId: afterNatal.id, quantity: 4, unitPrice: PRICES.afterNatal.sell, lineTotal: total } } } });
    await prisma.delivery.create({ data: { orderId: order.id, agentId: agentFlymack.id, status: "FAILED", failureReason: "Customer rejected at door", scheduledTime: d("2026-03-20T10:00:00Z") } }); }

  // #54 — Ibrahim: 2× Trim and Tone — FAILED
  { const total = PRICES.trimTone.sell * 2;
    const order = await prisma.order.create({ data: { orderNumber: num(), customerId: ibrahim.id, salesRepId: emeka.id, agentId: agentSunmi.id, status: "FAILED", totalAmount: total, netAmount: total, deliveryFee: 1200, createdAt: d("2026-03-23T09:00:00Z"), items: { create: { productId: trimTone.id, quantity: 2, unitPrice: PRICES.trimTone.sell, lineTotal: total } } } });
    await prisma.delivery.create({ data: { orderId: order.id, agentId: agentSunmi.id, status: "FAILED", failureReason: "Unreachable customer", scheduledTime: d("2026-03-25T09:00:00Z") } }); }

  // #55 — Halima: 3× Linix — CANCELLED
  { const total = PRICES.linix.sell * 3;
    await prisma.order.create({ data: { orderNumber: num(), customerId: halima.id, salesRepId: emeka.id, status: "CANCELLED", totalAmount: total, netAmount: total, deliveryFee: 0, createdAt: d("2026-03-27T10:00:00Z"), items: { create: { productId: linix.id, quantity: 3, unitPrice: PRICES.linix.sell, lineTotal: total } } } }); }

  // EMEKA NWANKWO — April 2026 (1 DELIVERED, 1 FAILED, 1 PENDING)

  // #56 — Funke: 3× Prosxact — DELIVERED
  { const total = PRICES.prosxact.sell * 3;
    const order = await prisma.order.create({ data: { orderNumber: num(), customerId: funke.id, salesRepId: emeka.id, agentId: agentOla.id, status: "DELIVERED", totalAmount: total, netAmount: total, deliveryFee: 1000, createdAt: d("2026-04-08T09:00:00Z"), items: { create: { productId: prosxact.id, quantity: 3, unitPrice: PRICES.prosxact.sell, lineTotal: total } } } });
    await prisma.delivery.create({ data: { orderId: order.id, agentId: agentOla.id, status: "DELIVERED", scheduledTime: d("2026-04-10T10:00:00Z"), deliveredTime: d("2026-04-10T15:00:00Z") } }); }

  // #57 — Victor: 2× Shred Belly — FAILED
  { const total = PRICES.shredBelly.sell * 2;
    const order = await prisma.order.create({ data: { orderNumber: num(), customerId: victor.id, salesRepId: emeka.id, agentId: agentQudus.id, status: "FAILED", totalAmount: total, netAmount: total, deliveryFee: 800, createdAt: d("2026-04-13T10:00:00Z"), items: { create: { productId: shredBelly.id, quantity: 2, unitPrice: PRICES.shredBelly.sell, lineTotal: total } } } });
    await prisma.delivery.create({ data: { orderId: order.id, agentId: agentQudus.id, status: "FAILED", failureReason: "Address not found", scheduledTime: d("2026-04-15T10:00:00Z") } }); }

  // #58 — Samuel: 4× Neuro-Vive Balm — PENDING
  { const total = PRICES.neuroBalm.sell * 4;
    await prisma.order.create({ data: { orderNumber: num(), customerId: samuel.id, salesRepId: emeka.id, status: "PENDING", totalAmount: total, netAmount: total, deliveryFee: 0, createdAt: d("2026-04-20T09:00:00Z"), items: { create: { productId: neuroBalm.id, quantity: 4, unitPrice: PRICES.neuroBalm.sell, lineTotal: total } } } }); }

  // ════════════════════════════════════════════════════════════════════════════
  // INVENTORY DATA
  // ════════════════════════════════════════════════════════════════════════════

  // ── Suppliers ────────────────────────────────────────────────────────────────
  const [supAustin, supGlobal, supZenith, supLagosImports, supNutrimax, supSunrise] = await Promise.all([
    prisma.supplier.create({ data: { name: "Austin Traders",          phone1: "+234SEED00001", state: "Lagos State",        country: "Nigeria", address: "14 Trade Way, Apapa, Lagos" } }),
    prisma.supplier.create({ data: { name: "Global Supplies Ltd",     phone1: "+234SEED00002", state: "Lagos State",        country: "Nigeria", address: "7 Commerce Road, Ikoyi, Lagos" } }),
    prisma.supplier.create({ data: { name: "Zenith Pharma",           phone1: "+234SEED00003", state: "FCT Abuja",          country: "Nigeria", address: "Plot 22 Wuse Zone 4, Abuja" } }),
    prisma.supplier.create({ data: { name: "Lagos Imports Ltd",       phone1: "+234SEED00004", state: "Lagos State",        country: "Nigeria", address: "33 Import Drive, Ojo, Lagos" } }),
    prisma.supplier.create({ data: { name: "Nutrimax Inc.",           phone1: "+234SEED00005", state: "Kano State",         country: "Nigeria", address: "10 Bello Road, Kano" } }),
    prisma.supplier.create({ data: { name: "Sunrise Distributors",    phone1: "+234SEED00006", state: "Rivers State",       country: "Nigeria", address: "5 GRA Phase II, Port Harcourt" } }),
  ]);

  // ── Warehouses ───────────────────────────────────────────────────────────────
  const [whLagos, whAbuja, whPH] = await Promise.all([
    prisma.warehouse.create({ data: { name: "[SEED] Lagos HQ",              address: "12 Femtech Estate, Ikeja, Lagos",          country: "Nigeria", phone: "+2341200000001", managerName: "Kunle Fashola",  managerPhone: "+2348070000101" } }),
    prisma.warehouse.create({ data: { name: "[SEED] Abuja Warehouse",       address: "Plot 45 Pamtech Park, Wuse II, Abuja",     country: "Nigeria", phone: "+2341200000002", managerName: "Ahmed Salisu",   managerPhone: "+2348070000102" } }),
    prisma.warehouse.create({ data: { name: "[SEED] Port Harcourt Depot",   address: "7 Trans-Amadi Industrial Layout, PH",      country: "Nigeria", phone: "+2341200000003", managerName: "Emeka Okonkwo",  managerPhone: "+2348070000103" } }),
  ]);

  console.log("  ✓ Suppliers and warehouses created");

  // ── INCOMING Stock Movements ──────────────────────────────────────────────────
  // Resulting net stock per product (INCOMING - OUTGOING + RETURN):
  //   Prosxact:        500 - 130 + 10 = 380  → OK  (min=100)
  //   Shred Belly:     350 - 150 + 20 = 220  → OK  (min=100)
  //   Fonio-Mill:      120 - 100 + 10 =  30  → Low (min=100)
  //   Trim and Tone:   350 - 290 + 15 =  75  → Low (min=100)
  //   After-Natal:     250 -  90 + 15 = 175  → OK  (min=100)
  //   Neuro-Vive Balm: 200 - 150 + 10 =  60  → Watch (min=50, watch < 75)
  //   Linix:           180 - 165 +  5 =  20  → Low (min=100)

  const inSI = await Promise.all([
    // SI-001
    prisma.stockMovement.create({ data: {
      referenceNumber: "SEED-SI-001", type: "INCOMING", status: "RECORDED",
      warehouseId: whLagos.id, supplierId: supAustin.id, supplierReference: "AUT-1001",
      date: d("2026-01-05T09:00:00Z"), createdById: adminUser.id,
      items: { create: [{ productId: prosxact.id, productCode: "SEED-PRX-001", quantity: 200 }] },
    }}),
    // SI-002
    prisma.stockMovement.create({ data: {
      referenceNumber: "SEED-SI-002", type: "INCOMING", status: "RECORDED",
      warehouseId: whAbuja.id, supplierId: supGlobal.id, supplierReference: "GLB-2001",
      date: d("2026-01-12T10:00:00Z"), createdById: adminUser.id,
      items: { create: [{ productId: shredBelly.id, productCode: "SEED-SHB-002", quantity: 150 }] },
    }}),
    // SI-003
    prisma.stockMovement.create({ data: {
      referenceNumber: "SEED-SI-003", type: "INCOMING", status: "RECORDED",
      warehouseId: whPH.id, supplierId: supZenith.id, supplierReference: "ZEN-3001",
      date: d("2026-01-20T11:00:00Z"), createdById: adminUser.id,
      items: { create: [{ productId: fonioMill.id, productCode: "SEED-FNM-003", quantity: 120 }] },
    }}),
    // SI-004
    prisma.stockMovement.create({ data: {
      referenceNumber: "SEED-SI-004", type: "INCOMING", status: "RECORDED",
      warehouseId: whLagos.id, supplierId: supLagosImports.id, supplierReference: "LGI-4001",
      date: d("2026-02-03T08:30:00Z"), createdById: adminUser.id,
      items: { create: [{ productId: trimTone.id, productCode: "SEED-TAT-004", quantity: 200 }] },
    }}),
    // SI-005
    prisma.stockMovement.create({ data: {
      referenceNumber: "SEED-SI-005", type: "INCOMING", status: "RECORDED",
      warehouseId: whAbuja.id, supplierId: supNutrimax.id, supplierReference: "NTM-5001",
      date: d("2026-02-15T09:00:00Z"), createdById: adminUser.id,
      items: { create: [{ productId: afterNatal.id, productCode: "SEED-ATN-006", quantity: 150 }] },
    }}),
    // SI-006
    prisma.stockMovement.create({ data: {
      referenceNumber: "SEED-SI-006", type: "INCOMING", status: "RECORDED",
      warehouseId: whPH.id, supplierId: supSunrise.id, supplierReference: "SUN-6001",
      date: d("2026-02-22T10:30:00Z"), createdById: adminUser.id,
      items: { create: [{ productId: neuroBalm.id, productCode: "SEED-NVB-005", quantity: 100 }] },
    }}),
    // SI-007
    prisma.stockMovement.create({ data: {
      referenceNumber: "SEED-SI-007", type: "INCOMING", status: "RECORDED",
      warehouseId: whLagos.id, supplierId: supAustin.id, supplierReference: "AUT-1007",
      date: d("2026-03-05T09:00:00Z"), createdById: adminUser.id,
      items: { create: [{ productId: linix.id, productCode: "SEED-LNX-007", quantity: 80 }] },
    }}),
    // SI-008 (multi-product)
    prisma.stockMovement.create({ data: {
      referenceNumber: "SEED-SI-008", type: "INCOMING", status: "RECORDED",
      warehouseId: whLagos.id, supplierId: supGlobal.id, supplierReference: "GLB-2008",
      date: d("2026-03-18T11:00:00Z"), createdById: adminUser.id,
      items: { create: [
        { productId: prosxact.id,   productCode: "SEED-PRX-001", quantity: 150 },
        { productId: afterNatal.id, productCode: "SEED-ATN-006", quantity: 100 },
      ]},
    }}),
    // SI-009
    prisma.stockMovement.create({ data: {
      referenceNumber: "SEED-SI-009", type: "INCOMING", status: "RECORDED",
      warehouseId: whLagos.id, supplierId: supAustin.id, supplierReference: "AUT-1009",
      date: d("2026-03-25T08:00:00Z"), createdById: adminUser.id,
      items: { create: [{ productId: shredBelly.id, productCode: "SEED-SHB-002", quantity: 200 }] },
    }}),
    // SI-010
    prisma.stockMovement.create({ data: {
      referenceNumber: "SEED-SI-010", type: "INCOMING", status: "RECORDED",
      warehouseId: whAbuja.id, supplierId: supLagosImports.id, supplierReference: "LGI-4010",
      date: d("2026-04-10T09:30:00Z"), createdById: adminUser.id,
      items: { create: [{ productId: trimTone.id, productCode: "SEED-TAT-004", quantity: 150 }] },
    }}),
    // SI-011 — DRAFT (not counted in stock)
    prisma.stockMovement.create({ data: {
      referenceNumber: "SEED-SI-011", type: "INCOMING", status: "DRAFT",
      warehouseId: whLagos.id, supplierId: supZenith.id, supplierReference: "ZEN-3011",
      date: d("2026-04-18T14:00:00Z"), createdById: adminUser.id,
      notes: "Pending supplier confirmation",
      items: { create: [{ productId: fonioMill.id, productCode: "SEED-FNM-003", quantity: 80 }] },
    }}),
    // SI-012
    prisma.stockMovement.create({ data: {
      referenceNumber: "SEED-SI-012", type: "INCOMING", status: "RECORDED",
      warehouseId: whAbuja.id, supplierId: supAustin.id, supplierReference: "AUT-1012",
      date: d("2026-04-22T10:00:00Z"), createdById: adminUser.id,
      items: { create: [{ productId: linix.id, productCode: "SEED-LNX-007", quantity: 100 }] },
    }}),
    // SI-013 (recent — last 7 days chart)
    prisma.stockMovement.create({ data: {
      referenceNumber: "SEED-SI-013", type: "INCOMING", status: "RECORDED",
      warehouseId: whLagos.id, supplierId: supSunrise.id, supplierReference: "SUN-6013",
      date: d("2026-04-25T09:00:00Z"), createdById: adminUser.id,
      items: { create: [{ productId: neuroBalm.id, productCode: "SEED-NVB-005", quantity: 100 }] },
    }}),
    // SI-014 (recent — last 7 days chart)
    prisma.stockMovement.create({ data: {
      referenceNumber: "SEED-SI-014", type: "INCOMING", status: "RECORDED",
      warehouseId: whLagos.id, supplierId: supGlobal.id, supplierReference: "GLB-2014",
      date: d("2026-04-28T08:30:00Z"), createdById: adminUser.id,
      items: { create: [{ productId: prosxact.id, productCode: "SEED-PRX-001", quantity: 150 }] },
    }}),
  ]);
  console.log("  ✓ Incoming stock movements created (14)");

  // ── OUTGOING Stock Movements ─────────────────────────────────────────────────
  await Promise.all([
    // SO-001
    prisma.stockMovement.create({ data: {
      referenceNumber: "SEED-SO-001", type: "OUTGOING", status: "RECEIVED",
      warehouseId: whLagos.id, agentId: agentOla.id,
      state: "Lagos State", country: "Nigeria",
      date: d("2026-02-10T10:00:00Z"), createdById: adminUser.id,
      items: { create: [{ productId: prosxact.id, productCode: "SEED-PRX-001", quantity: 80 }] },
    }}),
    // SO-002
    prisma.stockMovement.create({ data: {
      referenceNumber: "SEED-SO-002", type: "OUTGOING", status: "RECEIVED",
      warehouseId: whAbuja.id, agentId: agentQudus.id,
      state: "Oyo State", country: "Nigeria",
      date: d("2026-02-18T11:00:00Z"), createdById: adminUser.id,
      items: { create: [{ productId: shredBelly.id, productCode: "SEED-SHB-002", quantity: 100 }] },
    }}),
    // SO-003
    prisma.stockMovement.create({ data: {
      referenceNumber: "SEED-SO-003", type: "OUTGOING", status: "RECEIVED",
      warehouseId: whPH.id, agentId: agentSunmi.id,
      state: "FCT Abuja", country: "Nigeria",
      date: d("2026-03-01T09:00:00Z"), createdById: adminUser.id,
      items: { create: [{ productId: fonioMill.id, productCode: "SEED-FNM-003", quantity: 100 }] },
    }}),
    // SO-004
    prisma.stockMovement.create({ data: {
      referenceNumber: "SEED-SO-004", type: "OUTGOING", status: "RECEIVED",
      warehouseId: whLagos.id, agentId: agentFlymack.id,
      state: "Lagos State", country: "Nigeria",
      date: d("2026-03-10T08:30:00Z"), createdById: adminUser.id,
      items: { create: [{ productId: trimTone.id, productCode: "SEED-TAT-004", quantity: 150 }] },
    }}),
    // SO-005
    prisma.stockMovement.create({ data: {
      referenceNumber: "SEED-SO-005", type: "OUTGOING", status: "RECEIVED",
      warehouseId: whLagos.id, agentId: agentOla.id,
      state: "Lagos State", country: "Nigeria",
      date: d("2026-03-20T10:00:00Z"), createdById: adminUser.id,
      items: { create: [{ productId: afterNatal.id, productCode: "SEED-ATN-006", quantity: 60 }] },
    }}),
    // SO-006
    prisma.stockMovement.create({ data: {
      referenceNumber: "SEED-SO-006", type: "OUTGOING", status: "RECEIVED",
      warehouseId: whLagos.id, agentId: agentQudus.id,
      state: "Lagos State", country: "Nigeria",
      date: d("2026-04-01T09:00:00Z"), createdById: adminUser.id,
      items: { create: [{ productId: neuroBalm.id, productCode: "SEED-NVB-005", quantity: 80 }] },
    }}),
    // SO-007
    prisma.stockMovement.create({ data: {
      referenceNumber: "SEED-SO-007", type: "OUTGOING", status: "RECEIVED",
      warehouseId: whAbuja.id, agentId: agentSunmi.id,
      state: "Oyo State", country: "Nigeria",
      date: d("2026-04-05T11:00:00Z"), createdById: adminUser.id,
      items: { create: [{ productId: linix.id, productCode: "SEED-LNX-007", quantity: 130 }] },
    }}),
    // SO-008
    prisma.stockMovement.create({ data: {
      referenceNumber: "SEED-SO-008", type: "OUTGOING", status: "NOT_RECEIVED",
      warehouseId: whLagos.id, agentId: agentFlymack.id,
      state: "Kaduna State", country: "Nigeria",
      date: d("2026-04-15T09:00:00Z"), createdById: adminUser.id,
      items: { create: [{ productId: prosxact.id, productCode: "SEED-PRX-001", quantity: 50 }] },
    }}),
    // SO-009 (recent)
    prisma.stockMovement.create({ data: {
      referenceNumber: "SEED-SO-009", type: "OUTGOING", status: "NOT_RECEIVED",
      warehouseId: whLagos.id, agentId: agentOla.id,
      state: "Lagos State", country: "Nigeria",
      date: d("2026-04-22T10:30:00Z"), createdById: adminUser.id,
      items: { create: [{ productId: trimTone.id, productCode: "SEED-TAT-004", quantity: 140 }] },
    }}),
    // SO-010 (recent — chart)
    prisma.stockMovement.create({ data: {
      referenceNumber: "SEED-SO-010", type: "OUTGOING", status: "NOT_RECEIVED",
      warehouseId: whAbuja.id, agentId: agentQudus.id,
      state: "Lagos State", country: "Nigeria",
      date: d("2026-04-30T09:00:00Z"), createdById: adminUser.id,
      items: { create: [{ productId: shredBelly.id, productCode: "SEED-SHB-002", quantity: 50 }] },
    }}),
    // SO-011 (recent — chart)
    prisma.stockMovement.create({ data: {
      referenceNumber: "SEED-SO-011", type: "OUTGOING", status: "NOT_RECEIVED",
      warehouseId: whAbuja.id, agentId: agentSunmi.id,
      state: "Oyo State", country: "Nigeria",
      date: d("2026-04-28T11:00:00Z"), createdById: adminUser.id,
      items: { create: [{ productId: afterNatal.id, productCode: "SEED-ATN-006", quantity: 30 }] },
    }}),
    // SO-012
    prisma.stockMovement.create({ data: {
      referenceNumber: "SEED-SO-012", type: "OUTGOING", status: "RECEIVED",
      warehouseId: whLagos.id, agentId: agentFlymack.id,
      state: "Kaduna State", country: "Nigeria",
      date: d("2026-04-20T10:00:00Z"), createdById: adminUser.id,
      items: { create: [{ productId: neuroBalm.id, productCode: "SEED-NVB-005", quantity: 70 }] },
    }}),
    // SO-013 (recent — chart)
    prisma.stockMovement.create({ data: {
      referenceNumber: "SEED-SO-013", type: "OUTGOING", status: "NOT_RECEIVED",
      warehouseId: whLagos.id, agentId: agentOla.id,
      state: "Lagos State", country: "Nigeria",
      date: d("2026-04-27T09:00:00Z"), createdById: adminUser.id,
      items: { create: [{ productId: linix.id, productCode: "SEED-LNX-007", quantity: 35 }] },
    }}),
  ]);
  console.log("  ✓ Outgoing stock movements created (13)");

  // ── RETURN Stock Movements ────────────────────────────────────────────────────
  await Promise.all([
    prisma.stockMovement.create({ data: {
      referenceNumber: "SEED-SR-001", type: "RETURN", status: "RECEIVED",
      warehouseId: whLagos.id, agentId: agentOla.id,
      state: "Lagos State", damaged: false, remarks: "Good condition",
      date: d("2026-03-15T10:00:00Z"), createdById: adminUser.id,
      items: { create: [{ productId: prosxact.id, productCode: "SEED-PRX-001", quantity: 10 }] },
    }}),
    prisma.stockMovement.create({ data: {
      referenceNumber: "SEED-SR-002", type: "RETURN", status: "RECEIVED",
      warehouseId: whAbuja.id, agentId: agentQudus.id,
      state: "Oyo State", damaged: false, remarks: "Unsold stock returned",
      date: d("2026-03-22T11:00:00Z"), createdById: adminUser.id,
      items: { create: [{ productId: shredBelly.id, productCode: "SEED-SHB-002", quantity: 20 }] },
    }}),
    prisma.stockMovement.create({ data: {
      referenceNumber: "SEED-SR-003", type: "RETURN", status: "RECEIVED",
      warehouseId: whPH.id, agentId: agentSunmi.id,
      state: "FCT Abuja", damaged: true, remarks: "Packaging damaged in transit",
      date: d("2026-04-01T09:30:00Z"), createdById: adminUser.id,
      items: { create: [{ productId: fonioMill.id, productCode: "SEED-FNM-003", quantity: 10 }] },
    }}),
    prisma.stockMovement.create({ data: {
      referenceNumber: "SEED-SR-004", type: "RETURN", status: "RECEIVED",
      warehouseId: whLagos.id, agentId: agentFlymack.id,
      state: "Kaduna State", damaged: true, remarks: "Customer refused delivery",
      date: d("2026-04-10T10:00:00Z"), createdById: adminUser.id,
      items: { create: [{ productId: trimTone.id, productCode: "SEED-TAT-004", quantity: 15 }] },
    }}),
    prisma.stockMovement.create({ data: {
      referenceNumber: "SEED-SR-005", type: "RETURN", status: "RECEIVED",
      warehouseId: whLagos.id, agentId: agentOla.id,
      state: "Lagos State", damaged: false, remarks: "Unsold — returned in good condition",
      date: d("2026-04-15T11:00:00Z"), createdById: adminUser.id,
      items: { create: [{ productId: afterNatal.id, productCode: "SEED-ATN-006", quantity: 15 }] },
    }}),
    prisma.stockMovement.create({ data: {
      referenceNumber: "SEED-SR-006", type: "RETURN", status: "RECEIVED",
      warehouseId: whLagos.id, agentId: agentQudus.id,
      state: "Lagos State", damaged: false, remarks: "Unsold stock",
      date: d("2026-04-20T09:00:00Z"), createdById: adminUser.id,
      items: { create: [{ productId: neuroBalm.id, productCode: "SEED-NVB-005", quantity: 10 }] },
    }}),
    prisma.stockMovement.create({ data: {
      referenceNumber: "SEED-SR-007", type: "RETURN", status: "RECEIVED",
      warehouseId: whAbuja.id, agentId: agentSunmi.id,
      state: "Oyo State", damaged: false, remarks: "Returned unsold",
      date: d("2026-04-25T10:00:00Z"), createdById: adminUser.id,
      items: { create: [{ productId: linix.id, productCode: "SEED-LNX-007", quantity: 5 }] },
    }}),
  ]);
  console.log("  ✓ Return stock movements created (7)");

  // ── Purchase Orders ───────────────────────────────────────────────────────────
  await Promise.all([
    prisma.purchaseOrder.create({ data: {
      poNumber: "SEED-PO-001", supplierId: supAustin.id, status: "PENDING",
      date: d("2026-04-20T09:00:00Z"), createdById: adminUser.id,
      items: { create: [{ productId: prosxact.id, quantity: 100, unitCost: PRICES.prosxact.cost }] },
    }}),
    prisma.purchaseOrder.create({ data: {
      poNumber: "SEED-PO-002", supplierId: supZenith.id, status: "PENDING",
      date: d("2026-04-22T10:00:00Z"), createdById: adminUser.id,
      items: { create: [{ productId: fonioMill.id, quantity: 200, unitCost: PRICES.fonioMill.cost }] },
    }}),
    prisma.purchaseOrder.create({ data: {
      poNumber: "SEED-PO-003", supplierId: supAustin.id, status: "IN_TRANSIT",
      date: d("2026-04-25T09:00:00Z"), createdById: adminUser.id,
      items: { create: [{ productId: linix.id, quantity: 150, unitCost: PRICES.linix.cost }] },
    }}),
    prisma.purchaseOrder.create({ data: {
      poNumber: "SEED-PO-004", supplierId: supLagosImports.id, status: "PENDING",
      date: d("2026-04-28T10:00:00Z"), createdById: adminUser.id,
      items: { create: [{ productId: trimTone.id, quantity: 200, unitCost: PRICES.trimTone.cost }] },
    }}),
    prisma.purchaseOrder.create({ data: {
      poNumber: "SEED-PO-005", supplierId: supGlobal.id, status: "IN_TRANSIT",
      date: d("2026-04-30T09:00:00Z"), createdById: adminUser.id,
      items: { create: [{ productId: shredBelly.id, quantity: 100, unitCost: PRICES.shredBelly.cost }] },
    }}),
  ]);
  console.log("  ✓ Purchase orders created (5)");

  // ── Stock Transfers ───────────────────────────────────────────────────────────
  await Promise.all([
    prisma.stockTransfer.create({ data: {
      referenceNumber: "SEED-ST-001", sourceType: "WAREHOUSE", sourceId: whLagos.id,
      targetType: "WAREHOUSE", targetId: whAbuja.id, status: "COMPLETED",
      date: d("2026-03-10T10:00:00Z"), createdById: adminUser.id,
      notes: "Restocking Abuja warehouse",
      items: { create: [
        { productId: prosxact.id,  quantity: 50 },
        { productId: shredBelly.id, quantity: 30 },
      ]},
    }}),
    prisma.stockTransfer.create({ data: {
      referenceNumber: "SEED-ST-002", sourceType: "WAREHOUSE", sourceId: whAbuja.id,
      targetType: "AGENT",     targetId: agentSunmi.id, status: "COMPLETED",
      date: d("2026-04-05T09:00:00Z"), createdById: adminUser.id,
      notes: "Transfer to Oyo agent",
      items: { create: [{ productId: trimTone.id, quantity: 60 }] },
    }}),
    prisma.stockTransfer.create({ data: {
      referenceNumber: "SEED-ST-003", sourceType: "WAREHOUSE", sourceId: whPH.id,
      targetType: "WAREHOUSE", targetId: whLagos.id, status: "SUBMITTED",
      date: d("2026-04-20T10:00:00Z"), createdById: adminUser.id,
      notes: "Consolidating stock at Lagos HQ",
      items: { create: [{ productId: neuroBalm.id, quantity: 30 }] },
    }}),
    prisma.stockTransfer.create({ data: {
      referenceNumber: "SEED-ST-004", sourceType: "WAREHOUSE", sourceId: whLagos.id,
      targetType: "AGENT",     targetId: agentOla.id, status: "DRAFT",
      date: d("2026-04-28T11:00:00Z"), createdById: adminUser.id,
      notes: "Pending dispatch review",
      items: { create: [{ productId: afterNatal.id, quantity: 40 }] },
    }}),
    prisma.stockTransfer.create({ data: {
      referenceNumber: "SEED-ST-005", sourceType: "WAREHOUSE", sourceId: whAbuja.id,
      targetType: "WAREHOUSE", targetId: whPH.id, status: "DRAFT",
      date: d("2026-04-30T09:30:00Z"), createdById: adminUser.id,
      notes: "PH stock replenishment draft",
      items: { create: [{ productId: linix.id, quantity: 50 }] },
    }}),
  ]);
  console.log("  ✓ Stock transfers created (5)");

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log("✅  Done!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔑  LOGIN CREDENTIALS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Sales Rep  │  tolani@seed.nutritcare       │  SalesRep@123");
  console.log("  Sales Rep  │  chiamaka@seed.nutritcare     │  SalesRep@123");
  console.log("  Sales Rep  │  blessing.ehijie@seed.…       │  SalesRep@123");
  console.log("  Sales Rep  │  emeka@seed.nutritcare        │  SalesRep@123");
  console.log("  Admin      │  admin@seed.nutritcare        │  Admin@123");
  console.log("  Del. Agent │  ola@seed.nutritcare          │  Agent@123");
  console.log("  Del. Agent │  qudus@seed.nutritcare        │  Agent@123");
  console.log("  Del. Agent │  sunmi@seed.nutritcare        │  Agent@123");
  console.log("  Del. Agent │  flymack@seed.nutritcare      │  Agent@123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📦  ORDERS: 58 total across 4 sales reps");
  console.log("  Tolani (27): March 7D+3F+2C | April 4P+2Conf+5D+2C+2F");
  console.log("  Chiamaka(12): March 5D+1F+1C | April 2D+2Conf+1P");
  console.log("  Blessing(11): March 4D+1F+1C | April 1D+2Conf+2P");
  console.log("  Emeka   (8): March 2D+2F+1C | April 1D+1F+1P");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🏭  INVENTORY: 6 suppliers | 3 warehouses | 14 incoming | 13 outgoing | 7 returns | 5 POs | 5 transfers");
  console.log("  Net stock:  Prosxact=380(OK) | ShredBelly=220(OK) | FonioMill=30(Low)");
  console.log("              TrimTone=75(Low) | AfterNatal=175(OK) | NVBalm=60(Watch) | Linix=20(Low)");
  console.log("  Inv. Login  │  emeka.tl@seed.nutritcare     │  TeamLead@123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
