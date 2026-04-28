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
      prisma.product.create({ data: { name: "Prosxact",        costPrice: PRICES.prosxact.cost,   sellingPrice: PRICES.prosxact.sell,   sku: "SEED-PRX-001", categoryId: category.id, isActive: true } }),
      prisma.product.create({ data: { name: "Shred Belly",     costPrice: PRICES.shredBelly.cost, sellingPrice: PRICES.shredBelly.sell, sku: "SEED-SHB-002", categoryId: category.id, isActive: true } }),
      prisma.product.create({ data: { name: "Fonio-Mill",      costPrice: PRICES.fonioMill.cost,  sellingPrice: PRICES.fonioMill.sell,  sku: "SEED-FNM-003", categoryId: category.id, isActive: true } }),
      prisma.product.create({ data: { name: "Trim and Tone",   costPrice: PRICES.trimTone.cost,   sellingPrice: PRICES.trimTone.sell,   sku: "SEED-TAT-004", categoryId: category.id, isActive: true } }),
      prisma.product.create({ data: { name: "Neuro-Vive Balm", costPrice: PRICES.neuroBalm.cost,  sellingPrice: PRICES.neuroBalm.sell,  sku: "SEED-NVB-005", categoryId: category.id, isActive: true } }),
      prisma.product.create({ data: { name: "After-Natal",     costPrice: PRICES.afterNatal.cost, sellingPrice: PRICES.afterNatal.sell, sku: "SEED-ATN-006", categoryId: category.id, isActive: true } }),
      prisma.product.create({ data: { name: "Linix",           costPrice: PRICES.linix.cost,      sellingPrice: PRICES.linix.sell,      sku: "SEED-LNX-007", categoryId: category.id, isActive: true } }),
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
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
