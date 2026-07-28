# Upsell Package Pricing (Add-Product on an existing order)

> Status: **PLANNED — not yet implemented.** All stakeholder decisions are in (final round 2026-07-28); spec below is final and ready to implement on approval.
> Owner decision log is at the bottom.

## Problem / Context

Products are **not** priced per-unit. Each product is sold through an order **form** (built by admin / media-buyer) where quantity **packages** are defined with their own price — e.g. qty 2 = ₦5,000, qty 4 = ₦8,000, qty 6 = ₦11,000 (not `unit × qty`). These tiers live per-form in `Form.data.priceVariations`.

- Orders arriving from a public form are **priced correctly** today: `app/api/orders/form-submit/route.ts` stores `lineTotal = packagePrice`, `unitPrice = packagePrice / packageQty`, and records `Order.formId`.
- But when a sales rep **upsells** (the "Add Product" popup on the order detail page), `addOrderItemsAction` ignores packages and does **`Product.sellingPrice × quantity`** — wrong price for qty 2/4/6.

Goal: the upsell must use the **exact package price for that quantity**, sourced from the relevant **active** form — the same price the form would charge. When the (merged) quantity has **no** exact package, the price = **nearest lower package price + (surplus units × a unit price the sales-rep types in)** (see the pricing rule below). Same-product upsells **merge** into the existing line and re-price at the combined quantity.

Every upsellable product already has its own form with its packages, so a source of truth always exists for real products.

**Note — `Product.sellingPrice` is NOT used for the surplus units.** Stakeholders decided the per-unit price changes too often to trust a stored value, so for any non-package quantity the **sales-rep manually enters the price of one unit** in the Add-Product popup, and that typed value drives the surplus math. (`Product.costPrice` has separately been removed from the Inventory UI by another change — the CEO does not want the inventory manager to see or set cost — so a cost-based price floor is **out of scope** here; see guardrails.)

### Why correct pricing matters — the discount column depends on it

The order detail has a **discount** feature: after products are added, the CS can apply a discount, and the UI shows an **original price** column vs the discounted net. The discount flow (`applyOrderDiscountAction` in `modules/orders/actions/orders.action.ts`) computes the gross/original price as the **sum of the stored `OrderItem.lineTotal`s**, then `netAmount = gross − discountAmount`. So:

- The **"original price" column IS the sum of stored line totals.** If an upsell stores the wrong line total (`sellingPrice × qty`), the original-price column is wrong **and** any discount the CS enters is calculated off a wrong base.
- Fixing the upsell to store the true **package price** as `lineTotal` makes the original-price column correct, and the existing discount logic then applies correctly on top — **no change needed to the discount code** (it already reads stored line totals). Order of operations stays: set correct original line price at add-time → CS applies discount afterward.

## Key facts (verified in code)

- `Form` model: `data Json`, `disabledAt DateTime?`, `deletedAt DateTime?`, `orders Int`, `updatedAt`. **Active form = `disabledAt = null AND deletedAt = null`.**
- `Form.data.selectedProduct` = the form's main product **id**; `Form.data.priceVariations` = array of `{ id, productId, quantity, name, price, formattedPrice }`. **Verified in `FormBuilder.tsx`:** `quantity` is always a positive integer (`parseInt || 0`, then coerced `qty > 0 ? qty : 1`) — never missing, floored at 1; `price` is `parseFloat || 0`. Order-bump and upsell products do **not** leak in (they live in separate `data.orderBumpPriceVariation` / `data.upsellItems[].priceVariations` structures).
- **⚠️ Contamination caveat (verified):** `buildVariations` (FormBuilder.tsx:235) pushes **combo and free-gift** variations into the *same* `data.priceVariations` array, and those carry a **different `productId`** (the combo/gift product's id) — with **gifts priced ₦0**. So filtering `data.priceVariations` by `productId` alone can match a gift (₦0) or combo of the target product from another form. **Mitigation (required):** only treat a variation as a real tier when it belongs to a form where that product is the **main** product — i.e. filter on `variation.productId === productId && form.data.selectedProduct === productId`.
- `Order.formId String?` — an order remembers the form it came from (`@@index([formId])`). Null for sales-rep manually-created / mock orders.
- `OrderItem`: `unitPrice`, `lineTotal`, `quantity`, `isUpsell`, `addedById` — **authoritative stored values**.
- **Blast radius is zero for displays.** Every price display (sales-rep & admin & logistics order detail, accounting sales-record/invoices, agent settlement via `Order.netAmount`, delivery-agent portal) reads the **stored** `OrderItem.lineTotal` / `unitPrice` / `Order.netAmount`. Nothing recomputes `sellingPrice × qty`. So fixing the write path fixes every downstream module automatically.
- `addOrderItemsAction` is in `modules/orders/actions/orders.action.ts` (~line 602). Current flat calc at ~641–647. It already recomputes order totals from the sum of stored `lineTotal` and preserves the existing discount (keep that logic).

## Pricing resolution rule

Two things happen on an upsell: (1) **merge** the added quantity into any existing line for the same product, then (2) **re-price** the merged quantity against the form's packages.

### Step 0 — Merge same-product lines (before pricing)

If the order **already has a line for the same product**, do **not** add a second line. Combine: `mergedQty = existingQty + addedQty`, and re-price the **single** line at `mergedQty`. The old line's price is replaced by the merged price.

- **Applies to any existing line for that product**, regardless of origin — whether it came in on the original form or was added by an earlier upsell. (Decision D.)
- Example: order came in with qty 2 of Product A; rep upsells 2 more → one line, qty 4, priced at the form's **4-package** (e.g. ₦8,000) — not two lines.

### Step 1 — Price the (merged) quantity `q`

New helper: `resolveUpsellPrice(productId, q, typedUnitPrice, orderFormId?) => { lineTotal, unitPrice, source: "package" | "surplus", requiresUnitPrice }`

Resolve the product's **package set** first (see "Which packages the helper reads" below), then:

1. **Exact package match.** If a package exists for exactly `q` → `lineTotal = packagePrice`, `unitPrice = round(packagePrice / q, 2)`, `source = "package"`, `requiresUnitPrice = false`. **No typed unit price needed.** (Decision A: the manual box only appears when there is no exact package.)
2. **No exact package → nearest lower package + surplus.** Let `qLower` = the largest package quantity `< q`, with price `pLower`. The surplus is `q − qLower` units, charged at the sales-rep's **typed unit price** `u`:
   > `lineTotal = pLower + (q − qLower) × u`
   `source = "surplus"`, `requiresUnitPrice = true`.
   - Example, packages 2 = ₦5,000 & 4 = ₦8,000, rep types `u = ₦3,000`:
     - `q = 3` → 5,000 + (1 × 3,000) = **₦8,000**
     - `q = 5` → 8,000 + (1 × 3,000) = **₦11,000**
     - `q = 6` → 8,000 + (2 × 3,000) = **₦14,000**
3. **No lower package exists** (`q` is below the smallest package, e.g. smallest is 2 and `q = 1`, or the product has no packages at all) → there is no package to anchor on, so `pLower = 0`, `qLower = 0`:
   > `lineTotal = q × u`
   `source = "surplus"`, `requiresUnitPrice = true`. (Decision: below the smallest package, charge `q × typedUnitPrice`; `q = 1` → the typed unit price itself.)

**`unitPrice` stored on the line** (Decision E): store the **rep's typed unit price `u`** for the surplus cases (steps 2 & 3); store `round(packagePrice / q, 2)` for the exact-package case (step 1). Consequence for surplus lines with `q > 1`: the invoice's `Qty × UnitPrice` will **not** equal `Amount` (e.g. `3 × 3,000 = 9,000 ≠ 8,000`), because the total includes a package base. Accepted — the **`lineTotal` is the authoritative charged amount** and is what every screen/total uses. For `q = 1` it reconciles exactly (`1 × u = u`).

### Which packages the helper reads (source of truth)

- **The order's own form first.** If `orderFormId` is set and that form is **active** (`disabledAt = null AND deletedAt = null`), use its `priceVariations` entries where `variation.productId === productId` **and** `form.data.selectedProduct === productId` (the main-product filter — see contamination caveat).
- **Otherwise, the product's active forms.** Among forms where `deletedAt = null AND disabledAt = null AND data.selectedProduct === productId`, use the package set from the one with the **latest `updatedAt`** (newest active form wins; "highest price" rejected).

Rounding: 2 dp, `Math.round(x * 100) / 100` (matches `form-submit`).

### Upsell revenue tracking (Option 2 — two fields on `OrderItem`)

Because same-product upsells **merge into one line** (single `isUpsell` flag can't
represent a part-original/part-upsell line), upsell revenue is tracked with two
dedicated columns instead:

```prisma
upsellAmount    Decimal  @default(0) @db.Decimal(10, 2)  // rep-added revenue on this line
upsellQuantity  Int      @default(0)                     // rep-added units on this line
```

Both default to 0 → **no existing query breaks** (accounting, invoices, settlements
untouched). Filled by `addOrderItemsAction`:

| Case | `isUpsell` | `upsellAmount` | `upsellQuantity` |
|---|---|---|---|
| Brand-new upsell line | `true` | full `lineTotal` | full `quantity` |
| Merge into a form line (survivor kept as the form line) | stays `false` | `+= (newLineTotal − oldLineTotal)` | `+= addedQty` |
| Merge into an existing upsell line | `true` | `+= (newLineTotal − oldLineTotal)` | `+= addedQty` |

Merging only adds units, so `newLineTotal − oldLineTotal ≥ 0` (guarded with `max(0, …)`).

**Reporting contract (for the colleague's reporting work, built last):**
- Upsell **revenue** = `SUM(upsellAmount)`.
- Upsell **units / "no. of upsells"** = `SUM(upsellQuantity)` (or count of items with `upsellQuantity > 0`).
- For a pure upsell line `upsellAmount == lineTotal`, so one formula covers pure and partial-upsell lines. **Report off these fields, NOT the legacy multi-item heuristic.**

**Legacy heuristic (leave as-is; colleague migrates when building reporting):** `upsellRate` / `upsellingTable` / `generalPerformanceScore` currently derive "upsell" from **multi-item orders** (`Set(productId).size > 1`, or `items.length > 1`), NOT from `isUpsell`. Locations: `modules/orders/services/analytics.service.ts` (sales-rep weekly report), `modules/users/services/users.service.ts`, `modules/data-analysis/services/data-analysis.service.ts`, `lib/performance.ts` (20% of General Performance), `lib/analytics-report.ts` (PDF). These two definitions already disagree on same-product lines; reconciling them onto `upsellAmount`/`upsellQuantity` is the colleague's reporting task, coordinated separately.

**Parallel path (out of scope, same bug):** `modules/orders/actions/admin-orders.action.ts` add-items also does `sellingPrice × qty` + `isUpsell:true` — align later for consistency.

### Guardrails on the typed unit price (Decision: option A — minimal)

- **Minimum > ₦0** — reject blank / zero / negative typed unit prices at both the popup and the server action.
- **Audit log** — record who set the price on which order item and when (`OrderItem.addedById` + an `AuditLog` entry) so finance can review manual pricing.
- Cost-floor, deviation-band, and manager-approval guardrails were considered and **deferred** (cost price is being removed from Inventory; the others add scope). See decision log.

## Implementation

### 1. Price resolver service
- New file (e.g. `modules/orders/services/tier-pricing.service.ts`) exporting `resolveUpsellPrice(productId, q, typedUnitPrice, orderFormId?)`.
- Reads forms via Prisma. Since packages live in `Form.data` JSON:
  - **Resolve the package set first (with the main-product filter):** try the order's own form (`prisma.form.findFirst({ where: { id: orderFormId, disabledAt: null, deletedAt: null } })`; use it only if `data.selectedProduct === productId`, then take `data.priceVariations` entries where `productId` matches); if none, query active forms (`where: { disabledAt: null, deletedAt: null }`, order by `updatedAt desc`) and take the packages from the first whose `data.selectedProduct === productId`. **The `selectedProduct === productId` filter is required** to avoid combo/gift contamination (see caveat).
  - **From the resolved package set** (list of `{ quantity, price }`): exact `q` match → package price (step 1, `requiresUnitPrice = false`); else `pLower + (q − qLower) × typedUnitPrice` where `qLower` = largest package qty `< q` (step 2); else (`q` below smallest or no packages) → `q × typedUnitPrice` (step 3). Steps 2 & 3 set `requiresUnitPrice = true`.
  - **Optional optimization (later):** indexed `mainProductId String?` column on `Form`, populated from `data.selectedProduct`, to avoid scanning JSON. Not required for v1.
- Return `{ lineTotal, unitPrice, source, requiresUnitPrice }`. `unitPrice` = `typedUnitPrice` for surplus cases, `round(packagePrice / q, 2)` for the exact-package case. Keep it dependency-light so both the action and the live-preview action can call it.
- **Guardrail:** reject `typedUnitPrice <= 0` whenever `requiresUnitPrice` is true.

### 2. `addOrderItemsAction` (the fix)
`modules/orders/actions/orders.action.ts` ~602:
- Add `formId: true` to the `order` `findFirst` select/include, and load the order's **existing items** (productId + quantity) for the merge step.
- Accept a **typed unit price per item** in the action input (required only for items whose merged quantity has no exact package; validate `> 0`).
- **Merge (Step 0):** for each incoming item, if a line for the same `productId` already exists on the order, compute `mergedQty = existingQty + addedQty` and **update that line** instead of inserting a new one; otherwise insert. Merge applies regardless of whether the existing line came from the form or a prior upsell (Decision D).
- **Price:** call `resolveUpsellPrice(item.productId, mergedQty, item.typedUnitPrice, order.formId ?? undefined)` (resolve before the write, `Promise.all`):
  ```ts
  const { lineTotal, unitPrice, requiresUnitPrice } = await resolveUpsellPrice(
    item.productId, mergedQty, item.typedUnitPrice, order.formId ?? undefined,
  );
  if (requiresUnitPrice && !(item.typedUnitPrice > 0)) throw /* validation error */;
  ```
- **Audit (guardrail):** when `source === "surplus"`, write an `AuditLog` entry capturing rep (`addedById`), order/item, productId, mergedQty, typedUnitPrice, lineTotal.
- Keep the existing totals recompute + discount preservation + agent stock-capacity checks unchanged. **Note:** capacity checks must key off the **merged** quantity delta, not the raw added quantity.

### 3. Add-Product popup — quantity stepper + manual unit price + live price
`app/(sales-rep)/sales-rep/orders/[id]/order-detail-client.tsx` (Add Product modal, ~1244–1343):
- Keep the product dropdown + `+/-` quantity stepper.
- Show a **live resolved price** per row (debounced) reflecting the **merged** quantity (existing line + this add), so the rep sees the true post-merge charge before confirming.
- **Manual unit-price input appears only when the merged quantity has no exact package** (`requiresUnitPrice === true`, Decision A). Validate `> 0` client-side. When an exact package matches, hide the input — no typing needed.
- Data source: new server action `resolveUpsellPriceAction(orderId, productId, addedQty, typedUnitPrice?) => { lineTotal, unitPrice, source, requiresUnitPrice, mergedQty }` (validates the rep owns the order, computes the merged quantity, calls `resolveUpsellPrice` with the order's `formId`). Call debounced on change.
- Display: show `₦{lineTotal}` prominently; when `source === "surplus"`, a muted hint like "priced from the {qLower}-pack + {surplus} × unit price".

### Critical files
- `modules/orders/services/tier-pricing.service.ts` — **new** resolver (`resolveUpsellPrice`).
- `modules/orders/actions/orders.action.ts` — `addOrderItemsAction` (merge + resolver + typed unit price + audit; select `formId` & existing items); new `resolveUpsellPriceAction`.
- `app/(sales-rep)/sales-rep/orders/[id]/order-detail-client.tsx` — merge-aware live price + conditional manual unit-price input in the Add-Product modal.
- Reference only (no change): `app/api/orders/form-submit/route.ts` (pricing precedent), `components/dashboard/forms/FormBuilder.tsx` (`data.selectedProduct`, `priceVariations` shape), `prisma/schema.prisma` (`Form`, `Order.formId`, `OrderItem`, `AuditLog`).

### Out of scope (owner decisions)
- **Manual New Order** (`createOrderAction`) keeps flat pricing for now — owner chose "just the upsell."
- No changes to how forms are built or to `ProductPackage`.
- Displays unchanged (they already read stored values).
- **Cost-price floor / deviation band / manager approval** guardrails — deferred; only min > 0 + audit log ship now.
- **Who owns `Product.costPrice`** now that Inventory can't set it — separate future item, does not block this.

## Verification
1. `npx tsc --noEmit` + lint clean.
2. Build a form for Product A with packages qty 2 = ₦5,000, 4 = ₦8,000. Take an order from it (so the order has `formId`).
3. **Exact package.** Order as the sales rep → Add Product → same product, qty 4 → popup shows **₦8,000**, no unit-price box; confirm → line `lineTotal` = 8,000, and the same figure shows in admin order detail, accounting sales record, and (once delivered) agent settlement.
4. **Merge (Decision B/D).** Order came in with qty 2 of A (₦5,000). Upsell 2 more of A → **one** line, qty 4, ₦8,000 (not two lines); the original ₦5,000 line is gone.
5. **Merge into a no-package quantity (Decision C).** Order has qty 2 of A. Upsell 1 more → merged qty 3, no 3-package → unit-price box appears; rep types ₦3,000 → line = 5,000 + (1 × 3,000) = **₦8,000**, qty 3, `unitPrice` stored = 3,000. Confirm audit-log entry written.
6. **Surplus math.** Fresh product with packages 2 & 4, type ₦3,000: qty 5 → 8,000 + (1×3,000) = ₦11,000; qty 6 → 8,000 + (2×3,000) = ₦14,000.
7. **Below smallest package.** Smallest package is 2, pick qty 1, type ₦3,000 → ₦3,000 (1 × typed); invoice row `1 × 3,000 = 3,000` reconciles.
8. **Guardrail.** Leave the unit-price box blank / enter 0 on a no-package quantity → blocked at popup and rejected by the action.
9. **Contamination.** Product G is a **free gift** (₦0) in some active form but the main product of its own form with packages → upsell prices from G's own form, never ₦0.
10. Two active forms for the same product with different package sets → the **newest** (`updatedAt`) form's packages are used; a disabled form is ignored.

## FUTURE (not implemented) — multi-form-per-product & the "which price?" ambiguity

**Capability already exists:** packages live on the **form** (`Form.data.priceVariations`), not the product, so the same product can have **many active forms with different prices** — one per Facebook ad / campaign — today. Each order records `Order.formId`, so **form-originated orders are already priced by their own campaign** and upsells of the **same** product use the order's own form. No rewrite needed for this.

**Ambiguity only in two upsell cases** (no form anchors the price):
1. A **manually-created order** (no `formId`).
2. Upselling a **different** product than the order's form main product.

**Current behavior:** the resolver falls back to the product's **newest active form** (`updatedAt desc`). This has **no fraud loophole** — the rep has zero control — and when "wrong" it errs toward the **current (usually higher) price**, protecting the company.

**Rejected option — let the rep pick the form in the popup.** It gives accuracy but **re-opens the pricing loophole the CEO wants closed**: the rep becomes a price selector and can always pick the **cheapest active form** (e.g. a stale promo) to under-charge for friends/kickbacks. It is *worse* than the guarded manual unit-price box because it can undercut even **locked package prices**, is **repeatable** on every order, and looks legitimate (a real form price) so nothing flags it.

**Recommended future design (if campaign-accurate pricing becomes a real need):**
- Capture the campaign **once, at order creation**, as an order-level attribute (the manual-order equivalent of `formId`) — **not** a per-upsell, per-line rep choice. Upsells then **inherit** that recorded form.
- This makes it **one audited decision tied to the order/customer** (a manager can review it), not an invisible repeatable lever.
- Layer guardrails: **active forms only**; **audit-log** the choice; a **floor** so a selected form priced **below the newest form** requires **manager approval**.
- Keep **newest-wins as the default**; only anchor to a recorded campaign when one was captured.

Decision: **defer.** Ship newest-wins (no loophole). Revisit only if reps upsell heavily on formless/different-product orders and campaign-accurate pricing is demanded.

## Decision log (final — 2026-07-28)
- **Merge same-product lines** into one, re-priced at the combined quantity — applies to **any** existing line for that product, form-origin or prior upsell (A: single line; D: always merge). ✅
- **Exact package** → form package price for that quantity; **no manual unit price** needed (A). ✅
- **No exact package** → `nearestLowerPackagePrice + (surplus units × sales-rep-typed unit price)`; **below smallest package / no packages** → `q × typedUnitPrice` (so qty 1 = typed price). ✅
- **`Product.sellingPrice` is NOT used** for surplus units — the rep types the current unit price each time (stakeholders: unit price changes too often). ✅
- **Manual unit-price box appears only when there is no exact package** (A). ✅
- **Stored `unitPrice`** = the rep's typed unit price for surplus lines (E); invoice `Qty × Unit` may not equal `Amount` for surplus qty > 1 — accepted, `lineTotal` is authoritative. ✅
- **Upsell revenue tracking = Option 2** (single merged line kept): new `OrderItem.upsellAmount` + `upsellQuantity`, default 0, filled on merge/create; reporting = `SUM(upsellAmount)` / `SUM(upsellQuantity)`. Colleague builds reporting last on these fields and migrates the legacy multi-item heuristic then. Merged form line keeps `isUpsell=false` (origin preserved; upsell tracked via the amount field, not the flag). ✅
- **Guardrails:** min > 0 + audit log only (option a). Cost floor / deviation band / manager approval deferred (cost price removed from Inventory). ✅
- Package source: order's form first → product's active forms (newest `updatedAt` wins; "highest price" rejected); read **active** forms only; **filter on `data.selectedProduct === productId`** to avoid combo/gift contamination. ✅
- Scope v1: upsell (`addOrderItemsAction`) only; not manual new-order creation. Cost-price ownership is a separate future item. ✅
