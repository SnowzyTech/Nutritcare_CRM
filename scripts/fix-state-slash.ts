/**
 * scripts/fix-state-slash.ts
 * ONE-OFF data fix for the August sheet import:
 *   (1) Clean customer.state values that carry a "State/City" slash into the
 *       plain Nigerian state name (agent matching is an exact state compare).
 *   (2) Correct the Spring Tide (Ibadan Springs) agent, which was created with
 *       state=null and statesCovered=["Ibadan"] (a city) -> state/coverage "Oyo".
 *
 * Explicit hand-checked mapping — the slash order is inconsistent in the sheet
 * (sometimes state first, sometimes city first), so never split blindly.
 *
 *   node --env-file=.env --import tsx scripts/fix-state-slash.ts            # dry-run
 *   FIX_ACK=I_UNDERSTAND node --env-file=.env --import tsx scripts/fix-state-slash.ts --commit
 */
import dns from "node:dns";
{
  const resolver = new dns.Resolver();
  resolver.setServers(["8.8.8.8", "8.8.4.4"]);
  const orig = dns.lookup.bind(dns);
  // @ts-expect-error — override the overloaded lookup with a resolve4-backed one.
  dns.lookup = (hostname: string, options: unknown, cb?: unknown) => {
    let opts = options as { all?: boolean } | ((...a: unknown[]) => void);
    let callback = cb as ((...a: unknown[]) => void) | undefined;
    if (typeof options === "function") {
      callback = options as (...a: unknown[]) => void;
      opts = {};
    }
    const all = !!(opts as { all?: boolean }).all;
    resolver.resolve4(hostname, (err, addrs) => {
      if (!err && addrs && addrs.length) {
        if (all) return callback!(null, addrs.map((a) => ({ address: a, family: 4 })));
        return callback!(null, addrs[0], 4);
      }
      return (orig as (...a: unknown[]) => void)(hostname, opts, callback);
    });
  };
}

import { prisma } from "@/lib/db/prisma";
import { withoutCameraAudit } from "@/lib/audit/context";

// Exact stored value -> correct plain state name.
const STATE_MAP: Record<string, string> = {
  "PHC/Rivers": "Rivers",
  "Oyo/Ibadan": "Oyo",
  "Ondo/Akure": "Ondo",
  "Akwa Ibom/Uyo": "Akwa Ibom",
  "Owerri/Imo": "Imo",
  "Kwara/Ilorin": "Kwara",
  "Taraba/Jalingo": "Taraba",
  "Kogi/Lokoja": "Kogi",
};

const COMMIT = process.argv.includes("--commit") && process.env.FIX_ACK === "I_UNDERSTAND";

async function main() {
  console.log(COMMIT ? "\n*** COMMIT MODE — writing to DB ***\n" : "\n--- DRY RUN (no writes) ---\n");

  // 1) Customers
  const customers = await prisma.customer.findMany({
    where: { state: { contains: "/" }, deletedAt: null },
    select: { id: true, name: true, state: true },
  });

  let fixed = 0;
  let unmapped = 0;
  for (const c of customers) {
    const target = STATE_MAP[c.state];
    if (!target) {
      console.log(`  [SKIP - no mapping] ${c.name}: "${c.state}"`);
      unmapped++;
      continue;
    }
    console.log(`  ${c.name}: "${c.state}" -> "${target}"`);
    fixed++;
    if (COMMIT) {
      await withoutCameraAudit(() =>
        prisma.customer.update({ where: { id: c.id }, data: { state: target } }),
      );
    }
  }
  console.log(`\nCustomers to fix: ${fixed}${unmapped ? ` (unmapped/skipped: ${unmapped})` : ""}`);

  // 2) Spring Tide agent
  const agent = await prisma.agent.findFirst({
    where: { companyName: { contains: "Spring", mode: "insensitive" } },
    select: { id: true, companyName: true, state: true, statesCovered: true },
  });
  if (agent) {
    console.log(
      `\nAgent "${agent.companyName}": state ${JSON.stringify(agent.state)} -> "Oyo", ` +
        `statesCovered ${JSON.stringify(agent.statesCovered)} -> ["Oyo"]`,
    );
    if (COMMIT) {
      await withoutCameraAudit(() =>
        prisma.agent.update({
          where: { id: agent.id },
          data: { state: "Oyo", statesCovered: ["Oyo"] },
        }),
      );
    }
  } else {
    console.log("\nSpring Tide agent NOT found.");
  }

  console.log(COMMIT ? "\n*** DONE — committed ***" : "\n--- dry run complete; re-run with --commit + FIX_ACK to apply ---");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
