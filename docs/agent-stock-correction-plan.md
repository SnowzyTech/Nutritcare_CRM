# Agent Stock Correction (maker–checker) — Implementation Plan

> **Status: IMPLEMENTED on the TEST DB.** Code complete; new tables created on the test
> database (`ep-calm-frog`). Still to do: end-to-end manual test, then production rollout
> (deploy code + run the table-creation step against prod — see "Production rollout" below).

## Production rollout (when ready to go live)

1. Merge/deploy the code to production (Vercel → prod DB).
2. Create the two new tables on the **prod** database. Point `.env` at the prod URL (or set
   `DATABASE_URL` to prod) and run the idempotent, additive script:
   ```
   node --import tsx scripts/create-agent-stock-tables.ts
   ```
   It prints the target DB host first — confirm it says the prod host before it finishes.
   It only CREATEs new tables (never alters existing ones), so it's safe on live data.
3. Verify: open `/admin/inventory/agent-stock` as an admin and `/inventory/agent-stock` as an
   inventory manager.

## Implemented files

- Schema: `AgentStockAdjustment` + `AgentStockAdjustmentItem` in `prisma/schema.prisma`.
- Table DDL: `scripts/create-agent-stock-tables.ts` (raw SQL, idempotent, reused for prod).
- Service: `modules/inventory/services/agent-stock-adjustment.service.ts`.
- Actions: `modules/inventory/actions/agent-stock.action.ts`
  (`getAgentStocksForCorrectionAction`, `createAgentStockCorrectionAction`,
  `approveAgentStockCorrectionAction`, `rejectAgentStockCorrectionAction`,
  `reverseAgentStockCorrectionAction`).
- UI: `components/inventory/agent-stock-client.tsx` (shared) + pages
  `app/(inventory)/inventory/agent-stock/page.tsx` (IM) and
  `app/(admin)/admin/inventory/agent-stock/page.tsx` (Admin).
- Nav: inventory sidebar link + admin "Inventory" dropdown (Approvals + Agent Stock Correction).

---

_Original design notes below._

> Related memory: agent stock has no adjustment tool today; agent stock only moves via
> dispatch-in / delivery-out / return. The existing `StockAdjustment` flow is warehouse-only.

## Context / goal

Agents' recorded stock drifts from physical reality during the CRM switch-over (e.g. system
shows **37** of a product for an agent who physically has **34**, because opening-balance /
historical stock movements entered on switch-over overstated it). There is **no tool to correct
an agent's stock today** — the existing `StockAdjustment` flow is warehouse/shelf-only.

We add an **Agent Stock Correction** feature where the operator enters the **correct actual
quantity**, restricted to **Inventory Manager + Admin**, governed by the **same maker–checker
approval** the app already uses for warehouse stock:

- **Inventory Manager** proposes a correction → it needs **Admin approval** before stock changes.
- **Admin** corrections **apply immediately** (admin is the approver tier) — this is also the
  transition "fast path" for the initial bulk reconciliation.

### Decisions already locked with the owner
- Operated by **Inventory Manager + Admin**.
- Operator **enters the correct actual quantity** (e.g. type `34`), not a delta.
- **Maker–checker**: IM proposals require admin approval; admin's own apply directly.
- Mandatory reason, fully audited (before/after, who, when), reversible.
- Guard against dropping below stock already committed to an agent's confirmed-undelivered orders.
- Does **not** touch agent cash/settlement — purely stock quantity.

## 1. Data model (new) — mirrors the existing `StockAdjustment` shape

Two new tables so a pending correction can be stored, listed, approved/rejected, and reversed:

- **`AgentStockAdjustment`**: `id`, `referenceNumber` (`ASA-####`), `agentId`, `reason`,
  `notes?`, `status` (reuse existing `StockAdjustmentStatus` enum:
  `DRAFT | PENDING_APPROVAL | RECORDED | REJECTED | REVERSED`), `date`, `createdById`,
  `approvedById?`, timestamps.
- **`AgentStockAdjustmentItem`**: `id`, `agentStockAdjustmentId`, `productId`,
  `quantityBefore` (system value captured at propose time, for the audit trail),
  `quantityAfter` (the correct actual qty entered), timestamps.

> **Migration note:** `prisma db push` is blocked by the live-DB `supplierInvoiceUrls` drift.
> Add these as **new tables via hand-written `CREATE TABLE` SQL** (run on `DIRECT_URL`), then add
> the models to `schema.prisma` and `prisma generate`. **Never** `db push --accept-data-loss`.
> DB scripts use the Neon DNS workaround (force Node DNS via 8.8.8.8; `node --env-file=.env`).

## 2. Service — `modules/inventory/services/agent-stock-adjustment.service.ts`

- `getAgentProductStocks(agentId)` — **reuse the existing helper** (already used by the returns
  flow) to list the agent's current per-product stock for the picker.
- `getAgentCommittedQuantities(agentId, productIds)` — reuse the committed logic from
  `agentHasAvailableStock` (`modules/delivery/services/agents.service.ts`): committed =
  Σ `OrderItem.quantity` for that agent's **CONFIRMED, not-yet-delivered** orders.
- `applyAgentStockCorrection(tx, agentId, items)` — sets each `StockLevel`
  (`locationKind: "AGENT"`, `locationId`, `productId`) to the **absolute** `quantityAfter` via
  upsert on the composite unique.
- List helpers: `listAgentStockAdjustments`, `getAgentStockAdjustmentById`,
  `getPendingAgentStockAdjustments`.

## 3. Actions — `modules/inventory/actions/agent-stock.action.ts`

Follow existing `stock.action.ts` patterns (`requireAuth`, `suppressCameraForRequest`, Zod,
`logActivity`, `revalidatePath`):

- `getAgentStocksForCorrectionAction(agentId)` — returns current qty **and** committed qty per
  product (so the UI can block bad values live).
- `createAgentStockCorrectionAction({ agentId, reason, items:[{ productId, quantityAfter }] })`
  - Roles: **Inventory Manager or Admin**.
  - Validate: `quantityAfter >= 0` and **`quantityAfter >= committed`** for each product
    (can't drop below promised stock) → else a clear error.
  - **If Admin** → apply immediately (status `RECORDED`, `applyAgentStockCorrection`, audit).
  - **If Inventory Manager** → save `PENDING_APPROVAL`, **notify all admins** (reuse
    `Notification`), audit "submitted for approval". Stock unchanged until approved.
- `approveAgentStockCorrectionAction(id)` — **Admin only**. **Re-checks the committed guard
  against current stock** (in case things changed since proposal), applies, sets `RECORDED` +
  `approvedById`, notifies the IM, audit.
- `rejectAgentStockCorrectionAction(id, reason)` — Admin only; status `REJECTED`, notify IM, audit.
- `reverseAgentStockCorrectionAction(id)` — Admin only; sets stock back to `quantityBefore`,
  status `REVERSED`, audit (mistake undo with a trail).

Every action writes a rich `logActivity` (before → after, agent, reason, actor);
`suppressCameraForRequest()` so the audit camera doesn't double-log.

## 4. UI

- **Inventory group** — new page `app/(inventory)/inventory/agent-stock/`:
  1. Pick an agent → table of their products showing **current system qty**, an input for
     **correct actual qty**, and a per-row hint if the value is below committed.
  2. Reason field (defaults to "CRM transition reconciliation").
  3. Submit → toast; if IM, "sent for admin approval"; if admin, "applied".
  - A list of this operator's recent corrections + statuses.
- **Admin** — a **pending agent corrections** review screen (mirror the existing
  `/admin/inventory/adjustment` approve/reject UX), with **Approve / Reject / Reverse**. Include a
  lightweight **batch-approve** (tick-all) so the transition queue clears fast.
- Add links to the **inventory sidebar** and **admin sidebar**; register the admin route in the
  admin-page access registry if that gating applies.

## 5. Reuse (do not duplicate)

- Approval/notify/audit **pattern** copied from `createAdjustmentAction` /
  `approveAdjustmentAction` in `modules/inventory/actions/stock.action.ts`.
- **Committed-stock** math reused from `agentHasAvailableStock` (no new stock math).
- Existing `Notification`, `logActivity`, `isAdmin`, `requireAuth`, `getAgentProductStocks`.

## 6. Guardrails (the "what not to do")

- Never a raw silent edit — every change is a recorded, reasoned, audited correction.
- ~~Can't set below committed confirmed-order stock (re-checked at approval).~~
  **Relaxed to a warning.** Since the stock guard moved to delivery time,
  `committed > on-hand` is a legal state (assignment deliberately allows an agent to
  be over-booked so an earlier booking can't block a newer order). Blocking here
  would make the tool unusable for exactly the agents that need correcting — and
  correcting stock is the documented fix for a refused delivery. Create, approve and
  reverse now return a `warning` naming the resulting shortfall instead of an error.
  The zero floor is enforced once, in `deliverOrder`. See `docs/agent-stock-commitment.md`.
- IM cannot self-approve; admin approval required for IM proposals.
- Reversible, not deletable, once applied.
- Approval window should stay short: at approval, show admin the **current** system qty vs the
  proposed value (stock may have moved via a delivery since the proposal was made — the apply sets
  the absolute value, so keep the window tight to avoid re-introducing drift).

## 7. What reducing agent stock affects (impact reference)

- **Order assignment / confirmation** — `findEligibleAgentForOrder` / `agentHasAvailableStock`
  use agent stock; corrected value flows through immediately. ✔ (intended)
- **Inventory reports & valuation** — "stock left with agents", agent stock maps, total inventory
  value shift to match reality. ✔ (intended)
- **Agent cash / settlement ledger** — **not affected** (driven by delivered-order money, not
  stock counts).

## 8. Verification

1. Add tables (raw SQL) → `prisma generate`; confirm client types.
2. As **Inventory Manager**: correct an agent 37 → 34 → status `PENDING_APPROVAL`, stock still 37,
   admin notified.
3. As **Admin**: approve → agent stock becomes 34 on the agent dashboard, inventory reports, and
   order-assignment eligibility; IM notified.
4. As **Admin**: do a direct correction → applies instantly (no queue).
5. Try to set below committed (agent has a confirmed order for 5, set to 3) → blocked with a clear
   message.
6. Reject and Reverse paths → statuses + audit entries correct.
7. `npm run lint`.

## Open items

- `referenceNumber` prefix: proposed `ASA-####` (Agent Stock Adjustment) unless changed.
