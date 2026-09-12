/**
 * scripts/report-agent-stock-risk.ts
 *
 * READ-ONLY pre-rollout check for the delivery-time stock gate.
 *
 * Until now, marking an order delivered decremented the agent's StockLevel with
 * no floor, so balances could (and did) go negative. `deliverOrder` now refuses
 * instead — which means any agent whose recorded stock is already short will have
 * their next delivery blocked the moment this ships.
 *
 * Run this against the live DB BEFORE deploying, and clear what it lists using
 * Inventory > Agent Stock Correction (an admin's correction applies immediately):
 *
 *   node --import tsx scripts/report-agent-stock-risk.ts
 *
 * It prints the target DB host first and only ever SELECTs.
 */
import { readFileSync } from "node:fs";

// Load .env ourselves and strip surrounding quotes/whitespace. Node's built-in
// --env-file leaves literal quotes when a value has a leading space before the
// opening quote (as this project's .env does), which breaks the Neon URL.
function loadEnv() {
  const raw = readFileSync(".env", "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue; // skips blank + `#`-commented lines
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

type NegativeRow = { agentName: string; productName: string; quantity: number };

async function main() {
  loadEnv();
  const host = (process.env.DATABASE_URL ?? "").match(/@([^/]+)/)?.[1] ?? "unknown";
  console.log(`Target DB host: ${host}\n`);

  // Import AFTER env is loaded — the Prisma client reads DATABASE_URL at construction.
  const { prisma } = await import("@/lib/db/prisma");
  const { getOverbookedAgents } = await import("@/modules/delivery/services/agents.service");

  try {
    // 1. Balances already below zero — legacy damage from the unguarded decrements.
    const negatives = await prisma.$queryRaw<NegativeRow[]>`
      SELECT a."companyName" AS "agentName",
             p.name          AS "productName",
             sl.quantity     AS "quantity"
      FROM stock_levels sl
      JOIN agents   a ON a.id = sl."locationId"
      JOIN products p ON p.id = sl."productId"
      WHERE sl."locationKind" = 'AGENT'
        AND sl.quantity < 0
      ORDER BY sl.quantity ASC
    `;

    console.log(`── Negative agent balances: ${negatives.length} ──`);
    for (const r of negatives) {
      console.log(`  ${r.agentName} · ${r.productName}: ${r.quantity}`);
    }
    if (negatives.length === 0) console.log("  (none)");

    // 2. Agents promising more than they hold — their next delivery will be refused.
    const overbooked = await getOverbookedAgents();

    console.log(`\n── Over-booked agents (delivery will be refused): ${overbooked.length} ──`);
    for (const r of overbooked) {
      console.log(
        `  ${r.agentName}${r.state ? ` (${r.state})` : ""} · ${r.productName}: holding ${r.held}, committed ${r.committed}, short ${r.short}`,
      );
    }
    if (overbooked.length === 0) console.log("  (none)");

    const affected = new Set([...overbooked.map((r) => r.agentId)]).size;
    console.log(
      `\nFix before rollout: ${negatives.length} negative row(s), ${affected} agent(s) over-booked.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("Failed:", e);
  process.exit(1);
});
