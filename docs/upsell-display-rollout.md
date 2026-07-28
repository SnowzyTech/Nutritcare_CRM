# Upsell Display Rollout (order-details "Upsold" card + list "+N" badge)

> Status: **IMPLEMENTED across all roles.** Sales-rep, Admin (+ Add-Product parity),
> Accounting, Logistics, Delivery-agent, and Sales-rep-manager/Sales-manager are done.
> Depends on the merged-line + tracking work in `docs/upsell-package-pricing.md`
> (`OrderItem.upsellAmount` / `upsellQuantity`). Shared helpers: `lib/orders/upsell.ts`
> (`upsellExtraCount`), `lib/orders/use-upsell-preview.ts`, and
> `modules/orders/services/upsell-apply.service.ts` (`applyUpsellItems`, `previewUpsellPrice`).

## Background

Same-product upsells now **merge into one `OrderItem`** with `upsellQuantity` /
`upsellAmount` recording the upsold portion. Two display consequences to roll out:

1. **Order-detail "Upsold" card** — a merged line shows the original quantity on
   the product card, and a separate purple **Upsold** card beneath it (product
   name + upsold quantity + upsold amount). Whole-upsell lines (a brand-new
   product) show the single purple "Upsold Product / UPSELL" card.
2. **List "+N" badge** — previously `items.length > 1`. Merging same-product
   upsells drops the line count, so the badge vanished. Fixed via
   `upsellExtraCount(items) = (items.length − 1) + count(items where !isUpsell && upsellQuantity > 0)`.

Reference implementation (done): `app/(sales-rep)/sales-rep/orders/[id]/order-detail-client.tsx` (cards) and `.../orders/orders-client.tsx` + `page.tsx` (badge).

## Who sees what (decisions)

| Surface | Upsold card in detail | Show ₦ amount | List "+N" badge |
|---|---|---|---|
| **Sales-rep** | ✅ done | ✅ | ✅ done |
| **Admin** | ✅ add | ✅ | ✅ add |
| **Accounting** | ✅ add | ✅ (finance owns upsell revenue) | ✅ if a list exists (verify) |
| **Sales-rep-manager** | ✅ add (mapper rework) | ✅ | ✅ add |
| **Sales-manager** | ✅ via re-export of sales-rep-manager | ✅ | ✅ via re-export |
| **Logistics** | ❌ no amount — **badge only** (fulfillment role) | ❌ | ✅ add |
| **Delivery-agent** | ❌ (fulfillment role) | ❌ | ✅ add (badge only) |

**Rule of thumb:** sales/finance/management see the upsold breakdown **incl. amount**; fulfillment roles (logistics, delivery-agent) never see the upsold **amount**. The **badge** is a lightweight "this order has extras" flag and can go everywhere.

## Per-surface work

### 1. Shared helper (do first)
Extract `upsellExtraCount(items)` from the sales-rep list into a shared util (e.g. `lib/orders/upsell.ts`) so every list imports one implementation. Update the sales-rep list to use it.

### 2. Admin
- **Detail** (`app/(admin)/admin/orders/[id]/order-detail-admin-client.tsx` + `page.tsx`): thread `upsellQuantity` + `upsellAmount` into the serialized items; render the original-qty split + separate "Upsold" card (mirror sales-rep). Note: admin already has a whole-line "Upsold Product" tag — keep it; add the **merged-line** card for partial upsells.
- **List** (`app/(admin)/admin/orders/orders-client.tsx` + `page.tsx`, and `order-assignment`): thread `upsellQuantity`/`isUpsell`; swap `items.length > 1` → `upsellExtraCount`.

### 3. Accounting
- **Detail** (`app/(accounting)/accounting/sales-record/[orderId]/OrderDetailsClient.tsx`): the line data comes from `modules/finance/services/sales-record.service.ts` (`OrderInvoiceLine`). Add `upsellQuantity`/`upsellAmount` to that line type + the service mapping, then render the Upsold card (with amount).
- **List:** verify whether the sales-record list shows a per-order product/badge; add `upsellExtraCount` if so.

### 4. Sales-rep-manager (also covers Sales-manager via re-export)
- **Detail** (`app/(sales-rep-manager)/sales-rep-manager/[repId]/orders/[orderId]/order-detail-client.tsx` via `_lib/map-order-detail.ts`): **biggest change.** `mapOrderToDetail` currently assumes **one** main + **one** upsell item (`find(!isUpsell)` / `find(isUpsell)`). Rework it to carry **per-line** data incl. `upsellQuantity`/`upsellAmount` (or a proper items array) so merged and multi upsells render correctly.
- **Lists** (`orders/team-orders-client.tsx`, `[repId]/orders/orders-client.tsx`, `order-assignment-client.tsx`): thread fields + `upsellExtraCount`.
- **Sales-manager**: pages re-export sales-rep-manager (`export { default } from ...`), so no separate work — verify after.

### 5. Logistics
- **Detail** (`app/(logistics)/logistics/orders/[id]/order-detail-client.tsx`): **no upsold card, no amount.** Leave item display as-is.
- **List** (`app/(logistics)/logistics/orders/orders-client.tsx`): add the **+N badge** only (thread `upsellQuantity`/`isUpsell` + `upsellExtraCount`).

### 6. Delivery-agent — OPEN
Fulfillment role; never sees amount. Decide whether it gets the **+N badge** in its order list. Detail: no upsold card.

## Data-threading checklist (repeats per surface)
1. Service uses `include` on items → all scalars (`upsellQuantity`, `upsellAmount`, `isUpsell`) are already fetched; usually **only the page's serialize-map + the client type** need the two fields added.
2. Any **optimistic** client-side order construction (e.g. sales-rep list "Add Order") must include `upsellQuantity: 0, isUpsell: false` to satisfy the type.

## Decisions (settled)
1. **Delivery-agent list:** ✅ show the +N badge (badge only, no amount).
2. **Logistics detail:** show **nothing** about upsell (badge only in its list).
3. **Accounting:** still verify whether its list needs the badge during that step.
4. **Build order (approved):** shared helper → Admin → Accounting → Logistics (badge) → Delivery-agent (badge) → Sales-rep-manager (mapper rework, covers Sales-manager).

## Admin "Add Product" parity (workstream (i) — do before the rest of the rollout)

The admin Add-Product is a **parallel implementation** that never got the upsell
upgrades. `adminAddOrderItemsAction` (admin-orders.action.ts) still does
`sellingPrice × qty`, **no merge**, no manual unit price, no guardrail, and **no
`upsellAmount`/`upsellQuantity` tracking** (so admin-added upsells are invisible to
reporting). Its popup (`order-detail-admin-client.tsx`) is the old rep popup (no
live price, no manual-price box).

**Decisions (settled):**
- Admin Add-Product now works on **PENDING + CONFIRMED** (matching the rep), incl.
  the **agent stock-capacity check** on CONFIRMED.
- Popup: **shared logic hook** (`useUpsellPreview`), each popup keeps its own skin.
- **Server pricing + write logic is a shared service** (`applyUpsellItems`) called by
  BOTH `addOrderItemsAction` (rep auth) and `adminAddOrderItemsAction` (admin auth) —
  the money math must never live in two copies. This is the key anti-drift move.

**Steps:**
1. **Extract `applyUpsellItems`** (e.g. `modules/orders/services/upsell-apply.service.ts`):
   consolidate items → merge into existing lines → `resolveUpsellPrice` → guardrail
   (`unitPrice > 0` when required) → recompute totals (preserve discount) →
   transaction (capacity check on CONFIRMED + writes with `upsellAmount`/`upsellQuantity`
   + order update). Returns `{ error }` or `{ ok, surplusPlans }` for audit logging.
   Move the rep action's current body into it near-verbatim (preserve behavior).
2. **`addOrderItemsAction`** (rep): load+authorize order (salesRep ownership), call the
   service, keep its audit logs. Behavior unchanged.
3. **`adminAddOrderItemsAction`**: `checkAdmin`, load order, allow PENDING+CONFIRMED,
   call the same service. Gains merge/pricing/tracking/discount-preservation.
4. **Preview core**: extract the compute from `resolveUpsellPriceAction` into a core that
   takes an already-authorized order; add `adminResolveUpsellPriceAction` (checkAdmin).
5. **`useUpsellPreview` hook**: pull the popup's preview/guardrail/typed-price state out of
   the rep popup into a shared hook; wire BOTH rep and admin popups to it.
6. **Admin popup markup**: add the unit-price field + conditional manual box + live
   "Total for N" + guardrail + correct total bump; remove the stale `sellingPrice` labels
   (same cleanup done on the rep popup).

## Suggested order of implementation
Shared helper → Admin (detail + list) → Accounting (service + detail) → Logistics (badge only) → Sales-rep-manager (mapper rework — trickiest, verify sales-manager after) → Delivery-agent (if approved). One surface per review, mirroring how the sales-rep work was done.
