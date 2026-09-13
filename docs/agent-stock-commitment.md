# Agent stock & order commitment

How an order lays claim to a delivery agent's stock, and where that claim is
actually enforced.

## The model

Agent stock lives in one place: `StockLevel` with `locationKind = "AGENT"` and
`locationId = agentId`. There is **no `reserved` column**. A "booking" is derived:

```
committed(agent, product) = Σ OrderItem.quantity
                            for that agent's CONFIRMED, not-deleted orders
free(agent, product)      = StockLevel.quantity − committed
```

`Order.status = CONFIRMED` **is** the commitment record. That is why cancelling or
failing an order needs no stock write — the units simply drop out of the tally.

One definition of `committed` exists: `getAgentCommittedQuantities()` in
`modules/delivery/services/agents.service.ts`. Everything else imports it.

## Where the guard sits, and why

It used to sit at **confirmation**: an agent was only eligible if `free ≥ needed`.
That meant a handful of early orders could lock up an agent's whole stock and make
a newer, more urgent order **impossible to confirm at all** — while the same code
let delivery decrement the balance straight past zero.

Both halves are now inverted:

| Stage | Rule |
|---|---|
| **Assign / confirm** | Permissive. The agent must **physically hold** the goods (`checkAgentOnHandStock`). What they have already promised elsewhere is ignored. |
| **Deliver** | Hard. `debitAgentForDelivery` refuses rather than writing a negative balance. |

Delivery is the right place for the hard rule because it is the only moment stock
is actually consumed. Everything before it is a promise, and promises can be
re-shuffled; a delivery cannot be un-eaten.

### Agent selection (`findEligibleAgentForOrder`)

1. State match on `Agent.state` / `Agent.statesCovered`.
2. **Tier 1** — agents with `free ≥ needed` on every line, tie-broken by fewest
   active CONFIRMED orders. The tidy path, taken whenever stock allows.
3. **Tier 2** — nobody has free stock: any agent **holding** every line, chosen so
   the resulting over-book is as small as possible (worst per-product deficit
   ascending, then fewest orders), so the shortfall spreads instead of piling on
   one agent. The caller gets `overbooked: true` plus the shortfalls, and shows
   them as a warning toast.
4. **Blocked** — only when no single agent in the state holds the whole order.
   That is a genuine stock-out; retrying will not help.

One agent always covers the whole order — orders are never split.

### Commit paths that follow the same rule

`confirmOrderAction`, `adminConfirmOrderAction`, `reviveOrderAction` (FAILED →
CONFIRMED), `applyUpsellItems` (add products to a confirmed order) and
`reassignAgentForOrder` all check **on-hand** under `lockAgent`. None of them
blocks on `committed`.

### The delivery gate (`modules/orders/services/deliver-order.service.ts`)

`deliverOrder()` is the single write path behind all four mark-delivered actions
(delivery agent, admin, sales manager, data analyst). In one transaction:

1. `lockAgent` — the consume path finally serialises with the commit paths.
2. `debitAgentForDelivery` — one **conditional** update per line
   (`quantity: { gte }`), so the floor holds at row level even against writers that
   don't take the lock (returns, agent→agent transfers, pick-pack credits,
   corrections). A missing `StockLevel` row counts as zero, not as "skip".
3. `Order.status` CONFIRMED → DELIVERED as a **guarded** `updateMany`, so a
   double-submit is a no-op rather than a second debit.
4. `Delivery` rows → DELIVERED with `deliveredTime`.

Then, outside the transaction, the idempotent `recordDeliveryFeeEntry`.
`undoOrderDelivery` reverses all four, crediting through `creditAgentForDelivery`.

On refusal nothing is written, the order stays CONFIRMED, the actor gets a message
naming the shortfall, and every inventory + logistics manager gets one
`Notification` (de-duplicated per agent while unread).

## Living with over-booking

Over-booking is a legal, expected state, so it has to be visible:

- **Agent** — `/delivery-agents/inventory` shows held vs scheduled plus a
  `Short by N` badge and a banner listing the affected products.
- **Logistics + Inventory** — `components/inventory/overbooked-agents-panel.tsx`
  (backed by `getOverbookedAgents()`, a single grouped SQL query) lists every
  agent/product where committed > held. It renders nothing when in balance.
- **Confirming user** — a warning toast naming the agent and the shortfall.

There is **no priority flag**: whoever the agent delivers first gets the stock.
That matches what physically happens in the field.

### Consequence for Agent Stock Correction

Because `committed > held` is now legal, the correction tool
(`modules/inventory/actions/agent-stock.action.ts`) no longer **blocks** a
correction below committed — that would have made it unusable for exactly the
agents that need correcting, and correcting stock is the documented fix for a
refused delivery. It warns instead, on create, approve and reverse. The zero floor
is `deliverOrder`'s job, not the correction tool's.

## Rollout

`scripts/report-agent-stock-risk.ts` (read-only) lists negative agent balances and
over-booked agents. Run it against the live DB **before** deploying the gate and
clear the list via Agent Stock Correction, or those agents' next deliveries will be
refused on day one.

No schema change is involved anywhere in this — it is all behavioural, so no
`prisma db push` and no exposure to the live `supplierInvoiceUrls` drift.
