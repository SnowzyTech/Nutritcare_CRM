/**
 * scripts/fix-spring-tide-state.ts
 * ONE-OFF data fix: Spring Tide Logistics (Ibadan Springs) is the only delivery
 * agent stored with the bare state "Oyo" instead of the canonical picker value
 * "Oyo State" (lib/constants/country-states.ts). It was written that way by the
 * earlier import repair, scripts/fix-state-slash.ts.
 *
 * Agent-to-order matching is an exact trim+lowercase compare
 * (modules/delivery/services/agents.service.ts findEligibleAgentForOrder), and
 * every Oyo customer is stored as "Oyo State" — so this agent is currently never
 * auto-matched to any Oyo order. Align it with the other two Oyo agents.
 *
 *   node --env-file=.env --import tsx scripts/fix-spring-tide-state.ts            # dry-run
 *   FIX_ACK=I_UNDERSTAND node --env-file=.env --import tsx scripts/fix-spring-tide-state.ts --commit
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

const TARGET_STATE = "Oyo State";
const COMMIT = process.argv.includes("--commit") && process.env.FIX_ACK === "I_UNDERSTAND";

async function main() {
  console.log(COMMIT ? "\n*** COMMIT MODE — writing to DB ***\n" : "\n--- DRY RUN (no writes) ---\n");

  // Match on the exact broken value too, so a re-run after the fix is a no-op
  // and we can never touch a different agent by name alone.
  const agents = await prisma.agent.findMany({
    where: { companyName: { contains: "Spring Tide", mode: "insensitive" }, deletedAt: null },
    select: { id: true, companyName: true, state: true, statesCovered: true },
  });

  if (agents.length === 0) {
    console.log("Spring Tide agent NOT found — nothing to do.");
    return;
  }
  if (agents.length > 1) {
    console.log(`REFUSING: ${agents.length} agents match "Spring Tide" — narrow the filter first:`);
    for (const a of agents) console.log(`  - ${a.companyName} (${a.id})`);
    process.exitCode = 1;
    return;
  }

  const agent = agents[0];
  console.log(`Agent: ${agent.companyName} (${agent.id})`);
  console.log(`  BEFORE  state=${JSON.stringify(agent.state)}  statesCovered=${JSON.stringify(agent.statesCovered)}`);

  if (agent.state === TARGET_STATE) {
    console.log("  Already canonical — no change needed.");
    return;
  }

  console.log(`  AFTER   state=${JSON.stringify(TARGET_STATE)}  statesCovered=${JSON.stringify([TARGET_STATE])}`);

  if (COMMIT) {
    await withoutCameraAudit(() =>
      prisma.agent.update({
        where: { id: agent.id },
        data: { state: TARGET_STATE, statesCovered: [TARGET_STATE] },
      }),
    );
    const after = await prisma.agent.findUnique({
      where: { id: agent.id },
      select: { state: true, statesCovered: true },
    });
    console.log(`  VERIFIED state=${JSON.stringify(after?.state)}  statesCovered=${JSON.stringify(after?.statesCovered)}`);
  }

  console.log(COMMIT ? "\n*** DONE — committed ***" : "\n--- dry run complete; re-run with --commit + FIX_ACK to apply ---");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
