# PENDING TASK — Backfill agent "Agent Funding" ledger entries for the imported August orders

> **Status:** NOT DONE — deferred by owner (2026-08-29). Owner will say "implement the agent-ledger
> backfill from `docs/agent-ledger-backfill-august-orders.md`" when ready.
> **When triggered:** build `scripts/backfill-august-agent-ledger.ts` from the spec below, run the
> dry-run, show the owner, then run live and verify.

## Why this is needed

The 99 August orders (24–29 Aug 2026) were loaded with `scripts/import-august-orders.ts` and the 75
delivered ones got `Delivery` rows + stock deduction via `scripts/backfill-august-deliveries.ts`.
BUT the import wrote orders **directly** (not through the app's "mark delivered" action), so the step
that normally runs on delivery — `recordDeliveryFeeEntry()` — never fired.

Result: **`AgentLedgerEntry` is empty**, so the accounting **Agent Settlements** page shows every agent
owes ₦0, when it should show the value of goods they collected on delivery.

## How the ledger works in this app (verified from code)

Two entry types on `AgentLedgerEntry`:
- **DELIVERY_FEE** debit — labelled **"Agent Funding"** in the UI (`refTypeLabel`). Created
  **automatically when an order is marked delivered**, debiting the agent the order's full
  `netAmount` (cash they collected, now owed to the company). Written by
  `recordDeliveryFeeEntry()` in `modules/finance/services/agent-settlement.service.ts:40`, called from
  every mark-delivered path: `delivery-agent-portal.action.ts:141`, `admin-orders.action.ts:266`,
  `sales-manager-orders.action.ts:71`, `data-analysis.action.ts:180`.
- **REMITTANCE** credit — created **by hand by the accountant** in the accounting module
  (`modules/finance/actions/settlements.action.ts:97`) when an agent pays. **DO NOT** create these
  in the backfill — the accountant records payments manually as normal.

`recordDeliveryFeeEntry` is **idempotent**: it skips if an entry with the same
`agentId + referenceType="DELIVERY_FEE" + referenceId=orderNumber` already exists. `runningBalance` is
`previousBalance + netAmount`, where previous balance = the agent's latest existing entry.

## Verified current state (as of 2026-08-29)

- Delivered imported orders **with an agent: 75**, across **32 agents**.
- Their combined `netAmount` = **₦3,213,500** — this is the total "Agent Funding" that should appear.
- `AgentLedgerEntry` rows: **0**. `AgentSettlement` rows: **0**.
- All 14 CONFIRMED + 10 PENDING imported orders have **no agent**, so they are correctly out of scope
  (no delivery, no agent funding).

## Scope / decisions

- Backfill **only** the 75 DELIVERED orders' DELIVERY_FEE ("Agent Funding") debits.
- Reuse `recordDeliveryFeeEntry()` — **do not** duplicate the money math, and **do not** call the
  full mark-delivered actions (they would also re-send WhatsApp and re-run stock deduction).
- Process **sequentially, sorted by agent then order date** so each agent's running balance chains
  correctly from ₦0 upward.
- Wrap writes in `withoutCameraAudit()` (no audit-log noise). Use the 8.8.8.8 DNS shim (see
  `[[neon-dns-servfail-workaround]]` / other scripts) and run with `node --env-file=.env --import tsx`.
- Idempotent + dry-run-by-default gate, same pattern as the other two import scripts.

## Ready-to-use script (`scripts/backfill-august-agent-ledger.ts`)

```ts
/**
 * Backfill DELIVERY_FEE ("Agent Funding") ledger entries for the 75 delivered
 * August orders — the step the direct import bypassed. See
 * docs/agent-ledger-backfill-august-orders.md.
 *
 * DRY-RUN unless BOTH: --commit  AND  LEDGER_ACK=I_UNDERSTAND
 *   node --env-file=.env --import tsx scripts/backfill-august-agent-ledger.ts            # dry-run
 *   LEDGER_ACK=I_UNDERSTAND node --env-file=.env --import tsx scripts/backfill-august-agent-ledger.ts --commit
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
import { recordDeliveryFeeEntry } from "@/modules/finance/services/agent-settlement.service";

const IMPORT_TAG = "imp:aug2026";
const COMMIT = process.argv.includes("--commit");
const ACK = process.env.LEDGER_ACK === "I_UNDERSTAND";

async function main() {
  const bar = "═".repeat(78);
  console.log(bar);
  console.log("  Backfill DELIVERY_FEE (Agent Funding) ledger entries");
  console.log(`  Mode: ${COMMIT && ACK ? "LIVE (writing)" : "DRY-RUN (no writes)"}`);
  console.log(bar);

  const orders = await prisma.order.findMany({
    where: {
      notes: { contains: `[${IMPORT_TAG}:` },
      status: "DELIVERED",
      agentId: { not: null },
      deletedAt: null,
    },
    select: {
      agentId: true, netAmount: true, orderNumber: true, date: true,
      agent: { select: { companyName: true } },
    },
    orderBy: [{ agentId: "asc" }, { date: "asc" }, { orderNumber: "asc" }],
  });

  const totalValue = orders.reduce((n, o) => n + Number(o.netAmount), 0);
  const distinctAgents = new Set(orders.map((o) => o.agentId)).size;
  const existing = await prisma.agentLedgerEntry.count({ where: { referenceType: "DELIVERY_FEE" } });
  console.log(`Delivered orders to fund: ${orders.length} across ${distinctAgents} agents`);
  console.log(`Total Agent Funding to record: ₦${totalValue.toLocaleString()}`);
  console.log(`Existing DELIVERY_FEE ledger rows: ${existing} (idempotent — dups are skipped)`);

  if (!(COMMIT && ACK)) {
    console.log("─".repeat(78));
    console.log("DRY RUN — nothing written.");
    console.log("  To run: LEDGER_ACK=I_UNDERSTAND node --env-file=.env --import tsx scripts/backfill-august-agent-ledger.ts --commit");
    return;
  }

  console.log("WRITING…");
  let created = 0;
  await withoutCameraAudit(async () => {
    for (const o of orders) {
      await recordDeliveryFeeEntry({
        agentId: o.agentId!,
        netAmount: Number(o.netAmount),
        orderNumber: o.orderNumber,
        date: o.date,
      });
      created++;
      if (created % 20 === 0) console.log(`   …${created}`);
    }
  });

  const rows = await prisma.agentLedgerEntry.count({ where: { referenceType: "DELIVERY_FEE" } });
  const sum = await prisma.agentLedgerEntry.aggregate({ _sum: { debit: true }, where: { referenceType: "DELIVERY_FEE" } });
  console.log("─".repeat(78));
  console.log(`DONE. processed=${created}`);
  console.log(`DELIVERY_FEE ledger rows now: ${rows} | total debit: ₦${Number(sum._sum.debit ?? 0).toLocaleString()}`);
  console.log(bar);
}

main()
  .catch((e) => { console.error("Backfill failed:", e); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
```

## Verification after live run

- `DELIVERY_FEE` ledger rows == **75**; total debit == **₦3,213,500** (matches delivered netAmount).
- Re-run the script → 0 new rows (idempotency).
- Open the accounting **Agent Settlements** page (`/accounting`, AgentSettlementClient): each of the 32
  agents now shows a positive "Agent Funding" / balance owed; the accountant records remittances (payments)
  by hand from there as agents pay.
- Confirm no audit-log noise: 0 new `AuditLog` rows created during the run.

## Do NOT
- Do not create REMITTANCE or ADJUSTMENT entries (those are the accountant's manual job).
- Do not route through `confirmOrderAction` / mark-delivered actions (WhatsApp + double stock effects).
- Do not run before the orders/deliveries exist (they already do, as of 2026-08-29).
