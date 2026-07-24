/**
 * One-off script to create realistic Drivers and Suppliers, indistinguishable
 * from real records (no seed/test markers). Drivers are weighted across the
 * same states as prisma/seed-delivery-agents.ts (the most popular states
 * among the 50 orders from prisma/seed-real-orders.ts). Suppliers are spread
 * across major Nigerian commercial hubs — they aren't tied to customer
 * delivery states since they supply goods into warehouses, not to customers.
 *
 * Uses the exact same services the real admin/logistics "Add Driver" and
 * "Add Supplier" flows call (createDriver, prisma.supplier.create matching
 * addSupplierAction exactly).
 *
 * Run:  npx tsx prisma/seed-drivers-suppliers.ts
 */

import { PrismaClient } from "@prisma/client";
import { createDriver } from "../modules/delivery/services/create-driver.service";

// Same weighting as prisma/seed-delivery-agents.ts (order volume per state).
const DRIVER_STATE_ALLOCATION: { state: string; count: number }[] = [
  { state: "Rivers", count: 2 },
  { state: "Enugu", count: 2 },
  { state: "Oyo", count: 2 },
  { state: "Abuja (FCT)", count: 2 },
  { state: "Kano", count: 1 },
  { state: "Lagos", count: 1 },
];

const SUPPLIER_STATES = ["Lagos", "Kano", "Rivers", "Oyo", "Abuja (FCT)", "Anambra"];
const SUPPLIER_COUNT = 6;

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

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const FIRST_NAMES = [
  "Chukwuemeka", "Ibrahim", "Tunde", "Musa", "Segun", "Bashir", "Kelechi", "Damilola",
  "Chidi", "Aminu", "Femi", "Suleiman", "Nnamdi", "Garba", "Wale",
];
const LAST_NAMES = [
  "Okafor", "Bello", "Adeyemi", "Eze", "Mohammed", "Okonkwo", "Balogun", "Nwosu",
  "Abubakar", "Olawale", "Uche", "Adebayo", "Lawal", "Chukwu",
];
const VEHICLE_PREFIXES = ["ABC", "LND", "KJA", "RVS", "ENU", "OYO", "FCT"];

function makeDriver(state: string) {
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);
  const phone = `0${randInt(70, 91)}${randInt(10_000_000, 99_999_999)}`;
  return {
    name: `${first} ${last}`,
    phone,
    address: `${randInt(1, 200)} ${last} Close, ${state}`,
    state,
    country: "Nigeria",
    vehicleNo: `${pick(VEHICLE_PREFIXES)}-${randInt(100, 999)}-${String.fromCharCode(65 + randInt(0, 25))}${String.fromCharCode(65 + randInt(0, 25))}`,
  };
}

const SUPPLIER_BUSINESS_WORDS = [
  "Nutra", "Wellness", "Vitalife", "PureLeaf", "BioNature", "HealthFirst", "Greenfield", "TrustPharma",
];
const SUPPLIER_SUFFIXES = ["Distributors", "Ventures", "Nigeria Ltd", "Supplies Co", "Trading Co", "Industries"];

function makeSupplier(state: string) {
  const name = `${pick(SUPPLIER_BUSINESS_WORDS)} ${pick(SUPPLIER_SUFFIXES)}`;
  const phone = `0${randInt(70, 91)}${randInt(10_000_000, 99_999_999)}`;
  return {
    name,
    phone1: phone,
    phone2: Math.random() > 0.5 ? `0${randInt(70, 91)}${randInt(10_000_000, 99_999_999)}` : undefined,
    state,
    address: `${randInt(1, 200)} Industrial Avenue, ${state}`,
    country: "Nigeria",
  };
}

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN", isActive: true }, select: { id: true } });
  if (!admin) throw new Error("No active ADMIN user found to attribute driver creation to.");

  // ── Drivers ──────────────────────────────────────────────────────────────────
  const totalDrivers = DRIVER_STATE_ALLOCATION.reduce((s, a) => s + a.count, 0);
  console.log(`Generating ${totalDrivers} drivers across ${DRIVER_STATE_ALLOCATION.length} states\n`);

  const createdDrivers: { name: string; state: string; phone: string; vehicleNo: string }[] = [];
  for (const { state, count } of DRIVER_STATE_ALLOCATION) {
    for (let i = 0; i < count; i++) {
      const input = makeDriver(state);
      const driver = await createDriver({ ...input, addedById: admin.id });
      createdDrivers.push({ name: driver.name, state, phone: driver.phone1, vehicleNo: driver.vehicleNo ?? "" });
      console.log(`  ✓ ${driver.name} (${state}) — ${driver.phone1} — ${driver.vehicleNo}`);
    }
  }

  // ── Suppliers ────────────────────────────────────────────────────────────────
  console.log(`\nGenerating ${SUPPLIER_COUNT} suppliers\n`);

  const createdSuppliers: { name: string; state: string; phone1: string }[] = [];
  const usedNames = new Set<string>();
  for (let i = 0; i < SUPPLIER_COUNT; i++) {
    const state = SUPPLIER_STATES[i % SUPPLIER_STATES.length];
    let input = makeSupplier(state);
    while (usedNames.has(input.name)) input = makeSupplier(state);
    usedNames.add(input.name);

    const supplier = await prisma.supplier.create({
      data: {
        name: input.name,
        phone1: input.phone1,
        phone2: input.phone2 ?? null,
        state: input.state,
        address: input.address,
        country: input.country,
      },
    });
    createdSuppliers.push({ name: supplier.name, state: supplier.state ?? "", phone1: supplier.phone1 });
    console.log(`  ✓ ${supplier.name} (${state}) — ${supplier.phone1}`);
  }

  console.log(`\n✓ Done. Created ${createdDrivers.length} drivers and ${createdSuppliers.length} suppliers.`);
}

main()
  .catch((e) => {
    console.error("Generation failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
