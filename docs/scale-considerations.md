# Scale Considerations

> Status: **advisory.** The company is building this CRM to scale the business — a
> large influx of orders is expected. This note records what is already
> scale-ready and the specific patterns to migrate **before** volume gets high.
> None of the items below require re-architecting; they are targeted optimizations.

## Already scale-ready (keep as-is)

- **PostgreSQL on Neon serverless with pooled (WebSocket) connections** (`lib/db/prisma.ts`). Right database choice; scales connections automatically; handles large order volumes.
- **Indexed foreign keys on the hot paths** — `Order.formId`, `OrderItem.orderId` / `productId` / `addedById`, `Form.createdById`, etc. Lookups stay fast as tables grow.
- **Layered architecture** (pages → actions → services → Prisma). Any single query can be optimized in its service without touching callers.
- **Upsell pricing write path** (`addOrderItemsAction` + `resolveUpsellPrice`) — the common case is a couple of indexed lookups; fine at scale.

## Migrate before high volume (do proactively with the reporting work)

### 1. In-memory analytics aggregation → SQL  ⚠️ highest priority
Several dashboards **load orders into memory and reduce them in JavaScript** rather than aggregating in the database. Examples:
- `modules/orders/services/analytics.service.ts` (sales-rep weekly report: rates, upsell, best product)
- `modules/users/services/users.service.ts` (rep/team metrics, best-selling & upselling tables)
- `modules/data-analysis/services/data-analysis.service.ts` (org-wide analytics)

This is fine for thousands of orders but will **not** scale to hundreds of thousands — it loads too many rows into app memory and recomputes on every request. **Fix (no rewrite):** move these aggregations into **SQL** (`groupBy`, `count`, `sum`, or raw aggregate queries) so the database does the counting and only returns totals. Since reporting is being built now, build it **query-based from day one** — this is the single most scale-important decision for reporting.

### 2. Package/form JSON scanning → indexed column
The formless-upsell fallback in `resolveUpsellPrice` scans **all active forms' `data` JSON** in code to find a product's packages. Fine for dozens/hundreds of forms. If form volume reaches the thousands, add the indexed `mainProductId String?` column on `Form` (populated on form create/update from `data.selectedProduct`) so the scan becomes an indexed lookup. Already noted in `docs/upsell-package-pricing.md` as an optional optimization.

### 3. General guidance for new reporting/queries
- **Aggregate in the database, not in app memory.** Prefer `prisma.*.groupBy` / `count` / `aggregate` or raw SQL over `findMany(...).reduce(...)` for metrics.
- **Paginate** any list endpoint that can grow unbounded (orders, customers, audit log).
- **Add indexes** for new filter/sort columns as they appear (status + createdAt ranges, salesRepId, etc.).
- **Upsell reporting** specifically: report off `OrderItem.upsellAmount` / `upsellQuantity` (see upsell-package-pricing.md) via SQL `SUM(...)`, not the legacy in-memory multi-item heuristic.
