# Upsell Package Pricing (Add-Product on an existing order)

> Status: **PLANNED — not yet implemented.** Deferred pending stakeholder discussion.
> Owner decision log is at the bottom.

## Problem / Context

Products are **not** priced per-unit. Each product is sold through an order **form** (built by admin / media-buyer) where quantity **packages** are defined with their own price — e.g. qty 2 = ₦5,000, qty 4 = ₦8,000, qty 6 = ₦11,000 (not `unit × qty`). These tiers live per-form in `Form.data.priceVariations`.

- Orders arriving from a public form are **priced correctly** today: `app/api/orders/form-submit/route.ts` stores `lineTotal = packagePrice`, `unitPrice = packagePrice / packageQty`, and records `Order.formId`.
- But when a sales rep **upsells** (the "Add Product" popup on the order detail page), `addOrderItemsAction` ignores packages and does **`Product.sellingPrice × quantity`** — wrong price for qty 2/4/6.

Goal: the upsell must use the **exact package price for that quantity**, sourced from the relevant **active** form — the same price the form would charge — falling back to `sellingPrice × qty` only when no tier applies.

Every upsellable product already has its own form with its packages, so a source of truth always exists for real products.

### Why correct pricing matters — the discount column depends on it

The order detail has a **discount** feature: after products are added, the CS can apply a discount, and the UI shows an **original price** column vs the discounted net. The discount flow (`applyOrderDiscountAction` in `modules/orders/actions/orders.action.ts`) computes the gross/original price as the **sum of the stored `OrderItem.lineTotal`s**, then `netAmount = gross − discountAmount`. So:

- The **"original price" column IS the sum of stored line totals.** If an upsell stores the wrong line total (`sellingPrice × qty`), the original-price column is wrong **and** any discount the CS enters is calculated off a wrong base.
- Fixing the upsell to store the true **package price** as `lineTotal` makes the original-price column correct, and the existing discount logic then applies correctly on top — **no change needed to the discount code** (it already reads stored line totals). Order of operations stays: set correct original line price at add-time → CS applies discount afterward.

## Key facts (verified in code)

- `Form` model: `data Json`, `disabledAt DateTime?`, `deletedAt DateTime?`, `orders Int`, `updatedAt`. **Active form = `disabledAt = null AND deletedAt = null`.**
- `Form.data.selectedProduct` = the form's main product **id**; `Form.data.priceVariations` = array of `{ id, productId, quantity, name, price, formattedPrice }` (the main product's qty tiers, plus any order-bump/combo/gift variations, each carrying their own `productId` + `quantity`).
- `Order.formId String?` — an order remembers the form it came from (`@@index([formId])`). Null for sales-rep manually-created / mock orders.
- `OrderItem`: `unitPrice`, `lineTotal`, `quantity`, `isUpsell`, `addedById` — **authoritative stored values**.
- **Blast radius is zero for displays.** Every price display (sales-rep & admin & logistics order detail, accounting sales-record/invoices, agent settlement via `Order.netAmount`, delivery-agent portal) reads the **stored** `OrderItem.lineTotal` / `unitPrice` / `Order.netAmount`. Nothing recomputes `sellingPrice × qty`. So fixing the write path fixes every downstream module automatically.
- `addOrderItemsAction` is in `modules/orders/actions/orders.action.ts` (~line 602). Current flat calc at ~641–647. It already recomputes order totals from the sum of stored `lineTotal` and preserves the existing discount (keep that logic).

## Pricing resolution rule

New helper: `resolveTierPrice(productId, quantity, orderFormId?) => number | null`

Tried in order:

1. **The order's own form first (no ambiguity).** If `orderFormId` is provided and that form is **active**, look in its `priceVariations` for an entry where `variation.productId === productId && variation.quantity === quantity`. If found → return `variation.price`. (This nails the common "same product, bigger quantity" case using the exact form the customer ordered through.)
2. **Otherwise, the product's active forms.** Find all forms where `deletedAt = null AND disabledAt = null` whose tiers include a variation matching `productId + quantity` (the product may be another form's main product). Collect the matching prices.
   - One form, or all prices equal → return that price.
   - **Conflict (active forms disagree)** → return the price from the form with the **latest `updatedAt`** (newest active form wins — reflects current pricing). *(Decision confirmed with owner; the alternative "highest price" was rejected.)*
3. **No matching active tier** (e.g. tiers are 2/4/6 but rep picked 3, or product has no form) → return `null`.

Caller (`addOrderItemsAction`) uses the result:
- If `price != null` → `lineTotal = price`, `unitPrice = round(price / quantity, 2)`, `quantity = quantity`. (Mirrors `form-submit`: the package price is the full line total; unit price is derived.)
- If `price == null` → **fallback** `unitPrice = Number(product.sellingPrice)`, `lineTotal = unitPrice × quantity` (today's behavior).

Rounding: 2 dp, matching `form-submit` (`Math.round(x * 100) / 100`).

## Implementation

### 1. Price resolver service
- New file (e.g. `modules/orders/services/tier-pricing.service.ts`) exporting `resolveTierPrice(productId, quantity, orderFormId?)`.
- Reads forms via Prisma. Since tiers live in `Form.data` JSON:
  - For step 1: `prisma.form.findFirst({ where: { id: orderFormId, disabledAt: null, deletedAt: null } })`, then scan `data.priceVariations` in JS.
  - For step 2: query candidate active forms and scan their `priceVariations` for `productId + quantity`. Start with a simple scan of active forms (`where: { disabledAt: null, deletedAt: null }`) filtered in JS by whether any variation matches; order by `updatedAt desc` so the first match is the latest.
  - **Optional optimization (later):** add an indexed `mainProductId String?` column on `Form`, populated on form create/update from `data.selectedProduct`, to avoid scanning JSON. Not required for v1 at current form volume.
- Return `number | null`. Keep it dependency-light so both the action and the live-preview action can call it.

### 2. `addOrderItemsAction` (the fix)
`modules/orders/actions/orders.action.ts` ~602:
- Add `formId: true` to the `order` `findFirst` select/include.
- Replace the flat map (~641–647) so each item calls `resolveTierPrice(item.productId, item.quantity, order.formId ?? undefined)`:
  ```ts
  const tier = await resolveTierPrice(item.productId, item.quantity, order.formId ?? undefined);
  const lineTotal = tier != null ? tier : Number(product.sellingPrice) * item.quantity;
  const unitPrice = tier != null ? Math.round((tier / item.quantity) * 100) / 100 : Number(product.sellingPrice);
  ```
  (Resolve prices before the map, e.g. `Promise.all`, since the helper is async.)
- Keep the existing totals recompute + discount preservation + agent stock-capacity checks unchanged.

### 3. Live price preview in the Add-Product popup
`app/(sales-rep)/sales-rep/orders/[id]/order-detail-client.tsx` (Add Product modal, ~1244–1343):
- Keep the product dropdown + `+/-` quantity stepper (per owner: keep the stepper, price by matching quantity).
- Show a **live resolved price** per row that updates when product or quantity changes, so the rep sees the exact charge (and whether it's a real tier vs. the `sellingPrice` fallback) **before** confirming. This also neutralizes the rare multi-form conflict — the rep sees the number.
- Data source for the preview: new server action `resolveUpsellPriceAction(orderId, productId, quantity) => { price, source: "form" | "fallback" }` (validates the rep owns the order, then calls `resolveTierPrice` with the order's `formId`). Call it debounced on change.
  - Optimization: preload the order's-form tiers into the popup so **same-product** quantity changes resolve instantly client-side; only fall to the server action for other products.
- Display: show `₦{price}` prominently; if `source === "fallback"`, a small muted "standard price" hint.

### Critical files
- `modules/orders/services/tier-pricing.service.ts` — **new** resolver.
- `modules/orders/actions/orders.action.ts` — `addOrderItemsAction` uses the resolver (+ select `formId`); new `resolveUpsellPriceAction`.
- `app/(sales-rep)/sales-rep/orders/[id]/order-detail-client.tsx` — live price in the Add-Product modal.
- Reference only (no change): `app/api/orders/form-submit/route.ts` (pricing precedent), `components/dashboard/forms/FormBuilder.tsx` (`data.selectedProduct`, `priceVariations` shape), `prisma/schema.prisma` (`Form`, `Order.formId`, `OrderItem`).

### Out of scope (owner decisions)
- **Manual New Order** (`createOrderAction`) keeps flat pricing for now — owner chose "just the upsell."
- No changes to how forms are built or to `ProductPackage`.
- Displays unchanged (they already read stored values).

## Verification
1. `npx tsc --noEmit` + lint clean.
2. Build a form for Product A with tiers qty 2 = ₦5,000, 4 = ₦8,000. Take an order from it (so the order has `formId`).
3. Open that order as the sales rep → Add Product → same product, qty 4 → popup shows **₦8,000**; confirm → the item's `lineTotal` is 8,000 (not `sellingPrice × 4`), order total updates, and the same figure shows in admin order detail, accounting sales record, and (once delivered) agent settlement.
4. Upsell a **different** product B (which has its own active form with tiers) at a defined quantity → priced from B's form.
5. Pick a quantity with **no** tier (e.g. 3) → popup shows the `sellingPrice × 3` fallback with the "standard price" hint; confirm stores that.
6. Two active forms for the same product with different qty-4 prices → the **newest** form's price is used; a disabled form is ignored.

## OPEN QUESTION FOR STAKEHOLDERS — quantity with no matching tier

If tiers are e.g. 1, 2, 4, 6, 8, 10 and the rep picks **3** (a quantity with no defined price), what price applies? Options:

1. **Constrain the picker to defined tier quantities** (3 not selectable). Always a real package price; no guesswork. *Requires changing the popup from a free stepper to a tier selector/snap.* **← recommended.**
2. **Allow any qty, fallback `sellingPrice × qty`** (current plan default). Simple, but can exceed a nearby package price (bulk discount inversion).
3. Allow any qty, **nearest-lower-tier implied unit price × qty** (e.g. tier 2 unit ₦2,500 × 3 = ₦7,500). Keeps bulk economics but invents a price never set by the company.
4. Allow any qty, **snap to nearest tier price**. Confusing / disputable.

Current plan assumes Option 2 as the fallback until this is decided. If Option 1 is chosen, the popup's quantity control and the "no tier" path change accordingly.

## Decision log
- Price source: order's form first → product's active forms → `sellingPrice × qty` fallback. ✅
- Multi-form conflict tiebreaker: **latest active form** (newest `updatedAt`); "highest price" rejected. ✅
- Only read **active** forms (`disabledAt = null, deletedAt = null`). ✅
- Keep the quantity stepper; match tier by exact quantity; live price preview in popup. ✅
- Scope v1: upsell (`addOrderItemsAction`) only; not manual new-order creation. ✅
