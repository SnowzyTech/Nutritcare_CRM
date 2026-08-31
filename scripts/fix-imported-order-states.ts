/**
 * scripts/fix-imported-order-states.ts
 * Rewrites customer.state values that carry the raw imported-spreadsheet format
 * ("Lagos", "Rivers", "Abuja", "Calabar") into the canonical dropdown format the
 * order form + delivery agents use ("Lagos State", "Rivers State",
 * "Federal Capital Territory (FCT)", "Cross River State"). Agent↔order matching
 * is an exact string compare, so this lets imported orders match their agent.
 *
 * Only touches customers whose current state is NOT already canonical and maps
 * cleanly to a canonical state (by name, or via the city alias map). Anything it
 * can't map safely is flagged and skipped — never guessed.
 *
 *   node --env-file=.env --import tsx scripts/fix-imported-order-states.ts            # dry-run
 *   STATE2_ACK=I_UNDERSTAND node --env-file=.env --import tsx scripts/fix-imported-order-states.ts --commit
 */
import dns from "node:dns";
{
  const resolver = new dns.Resolver();
  resolver.setServers(["8.8.8.8", "8.8.4.4"]);
  const orig = dns.lookup.bind(dns);
  // @ts-expect-error override overloaded lookup
  dns.lookup = (hostname: string, options: unknown, cb?: unknown) => {
    let opts = options as { all?: boolean } | ((...a: unknown[]) => void);
    let callback = cb as ((...a: unknown[]) => void) | undefined;
    if (typeof options === "function") { callback = options as (...a: unknown[]) => void; opts = {}; }
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
import { COUNTRY_STATES } from "@/lib/constants/country-states";

const CANONICAL = COUNTRY_STATES.Nigeria; // e.g. "Lagos State", "Federal Capital Territory (FCT)"
const canonicalSet = new Set(CANONICAL.map((s) => s.toLowerCase()));

// bare lowercase name (no " state") -> canonical value. "lagos" -> "Lagos State".
const bareToCanonical = new Map<string, string>();
for (const c of CANONICAL) bareToCanonical.set(c.toLowerCase().replace(/\s+state$/, ""), c);

// City / alternate spellings present in imported data -> canonical state.
const CITY_ALIAS: Record<string, string> = {
  "abuja": "Federal Capital Territory (FCT)",
  "fct": "Federal Capital Territory (FCT)",
  "calabar": "Cross River State",
  "jos": "Plateau State",
};

function canonicalFor(raw: string): string | null {
  const s = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (!s) return null;
  if (canonicalSet.has(s)) return null;            // already canonical — no change
  const bare = s.replace(/\s+state$/, "");
  if (bareToCanonical.has(bare)) return bareToCanonical.get(bare)!;
  if (CITY_ALIAS[bare]) return CITY_ALIAS[bare];
  return null;                                     // can't map safely
}

const COMMIT = process.argv.includes("--commit") && process.env.STATE2_ACK === "I_UNDERSTAND";

async function main() {
  console.log(COMMIT ? "\n*** COMMIT MODE — writing ***\n" : "\n--- DRY RUN (no writes) ---\n");

  const customers = await prisma.customer.findMany({
    where: { deletedAt: null, state: { not: "" } },
    select: { id: true, name: true, state: true },
  });

  let fixed = 0;
  const skipped: string[] = [];
  for (const c of customers) {
    const target = canonicalFor(c.state);
    if (!target) {
      // Only report ones that are NOT already canonical (those are fine).
      if (!canonicalSet.has(c.state.trim().toLowerCase()))
        skipped.push(`${c.name}: "${c.state}"`);
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

  console.log(`\nCustomers to fix: ${fixed}`);
  if (skipped.length) {
    console.log(`\n⚠ Could not map safely (left unchanged — review manually): ${skipped.length}`);
    skipped.forEach((s) => console.log(`   ${s}`));
  }
  console.log(COMMIT ? "\n*** DONE ***" : "\n--- dry run; re-run with --commit + STATE2_ACK to apply ---");
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
