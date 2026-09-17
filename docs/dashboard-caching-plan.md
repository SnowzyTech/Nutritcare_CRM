# Scope — Fix #3: Cache + SQL-aggregate the heavy dashboards ("scale-proofing")

**Status:** Scope only. No code yet. Prepared 2026-09-17.
**Companion to:** `docs/db-compute-review.md` (finding #3) + `docs/scale-considerations.md`.

## Why this is the real scaling lever

Neon scales the engine (and your bill) up on three signals: **CPU load, memory usage, and working-set size** (verified: neon.com/docs/guides/autoscaling-algorithm). The dashboards below all follow the same anti-pattern — `findMany(... all rows ...).reduce()` in JavaScript, **uncached**, re-run on **every page load/refresh**. As order/expense/audit data grows, each call pulls more rows into memory and burns more CPU — pushing exactly the two signals (CPU + working-set/memory) that make Neon scale to a bigger, pricier engine. This is the thing that takes you **above ~$20**, so it's the highest-value proactive work.

**Expectation setting:** at today's 364 orders this isn't slow yet — so this won't lower today's bill. Its payoff is **keeping the engine at the cheap 0.25 CU as data grows** (the difference between staying ~$20 vs drifting to $40–80), plus faster dashboards for staff now.

## Inventory of heavy read paths (grounded in the code)

| Service · function | Page (who hits it) | Current cost | Technique |
|---|---|---|---|
| `orders/…/admin-dashboard.service.ts` · `getAdminDashboardData` | `/admin` home (ADMIN + SUPER_ADMIN — the most-watched screen) | `computePeriodStats` ×2 (all orders **+ items**), whole-year revenue pull, weekly scan, 2× `stockLevel.findMany` | **Cache + SQL** |
| `orders/…/analytics.service.ts` · `getSalesRepAnalytics` | `/sales-rep/analytics`, data-analyst rep views | per-rep order scan + JS reduce (via `lib/performance.ts`) | **Cache + SQL** |
| `users/…/users.service.ts` · `getSalesRepAnalytics`, `getSalesRepOverview`, `getTeamAnalytics`, `getCompanyAnalytics`, `getCompanyOrderStatusCounts` | admin staff pages, `/sales-rep-manager/analytics` | order scans + JS reduce per rep/team/company | **Cache + SQL** |
| `finance/…/dashboard.service.ts` · `getFinancialSummary`, `getSalesTrends`, `getSalesByProduct`, `getSalesByState`, `getInventorySnapshot`, `getAgentSettlementSummary` | `/accounting` dashboard (ACCOUNTANT) | ~11 findMany/reduce over orders/expenses/stock | **Cache + SQL** |
| `delivery/…/logistics-dashboard.service.ts` · `getLogisticsDashboardData` | `/logistics` home (LOGISTICS_MANAGER) | multi findMany/reduce | **Cache** (SQL later) |
| `data-analysis/…/data-analysis.service.ts` · `getTeamsAnalytics`, `getCompanyAnalytics`, `getWeeklyOrderVolume`, `getMonthlyOrderVolume`, `getSalesRepAnalyticsForUI` | `/data` analyst boards | order scans + JS reduce | **Cache + SQL** |

All are keyed by **subject + period** (e.g. `salesRepId`, `teamId`, `year/month`, date range) — *not* by the viewer — so results are safely shareable across viewers and cacheable.

## Phase A — Caching (do first: fast, low-risk, biggest immediate win)

Wrap each heavy read in Next's Data Cache so the expensive scan runs **once per TTL** instead of **once per page load**. Same `unstable_cache` tool already used for forms (`lib/cache/tags.ts`).

**Pattern** (rename the current fn to a private `_impl`, wrap the export):
```ts
export function getAdminDashboardData(year: number, month: number) {
  return unstable_cache(
    () => _getAdminDashboardData(year, month),
    ["admin-dashboard", String(year), String(month)],   // key MUST include every arg
    { revalidate: 120 }                                   // 60–180s TTL
  )();
}
```

**Rules / caveats (from `lib/cache/tags.ts`):**
- **Key must include every argument** (userId/teamId/period/year/month) or dashboards will cross-contaminate.
- **No Decimals in the cached value** — convert `Prisma.Decimal` → `number`/`string` first (most of these already do for charts; audit each return shape).
- **Only subject-keyed data** — never cache anything keyed by the viewer's identity/permissions (none of the above are; keep it that way).
- Callbacks can't read cookies/headers — fine, these take explicit params.

**Invalidation — pick the simple default:** short TTL (60–180s) with **no explicit busting**. Managers don't need sub-minute freshness; a dashboard up to ~2 min stale is acceptable and this needs zero wiring. *(Optional refinement later: add coarse tags — `orders-analytics`, `finance-analytics`, `inventory-analytics` — and `revalidateTag` them in the order/expense/stock write actions for instant freshness. Only if someone complains about staleness.)*

**Effort:** ~1–2 hrs per service, low risk (pure wrapper, easy rollback). Ship the admin dashboard first (most-watched), then finance, sales-rep analytics, company/team, logistics, data-analyst — in that order.

## Phase B — SQL aggregation (deeper: do as data grows)

Replace `findMany(...).reduce()` with database-side `groupBy` / `_sum` / `_count` / raw SQL so each call **touches far less data** — this is what actually lowers the **memory/working-set** signal Neon scales on. Caching cuts *how often* the scan runs; SQL aggregation cuts *how heavy each run is*. Both compound.

**Examples of the rewrite:**
- `getAdminDashboardData` → `order.groupBy({ by: ["status"], _count, _sum: { netAmount } })` for the period stats instead of loading every order+item; `orderItem.groupBy` joined to product for best/least-selling + units sold; keep the existing `expense.aggregate` / `stockMovementItem.aggregate` (already SQL-side).
- Rep/team/company analytics → `groupBy(["salesRepId","status"])` with counts/sums, then compute rates from the small result set (the rates in `lib/performance.ts` are cheap once the raw counts are aggregated in SQL).

**Correctness notes:** rate/ratio KPIs (delivery, recovery, upsell, reorder) must be derived from the SAME aggregated counts the current JS uses, so numbers don't shift. Verify each rewritten dashboard against the current output over a known period before/after.

**Effort:** higher (per-function logic + verification). Do the heaviest scanners first (admin dashboard, company analytics, finance), and build any *new* reporting query-based from day one (per the scale doc).

## Risks & how we contain them

- **Staleness** (Phase A): bounded by TTL; start at 120s. Acceptable for dashboards; can add tag-busting if needed.
- **Decimal serialization**: audit each cached return for `Decimal`; convert to number first (known Data-Cache gotcha).
- **Number drift** (Phase B): verify each rewrite against current output on a fixed period; ship behind a before/after check.
- **Cache-key bugs**: every argument in the key; unit-eyeball two different subjects/periods return different data.

## What this achieves

- ✅ Heavy scans run **once per TTL**, not once per refresh → far less CPU + repeated memory pressure (Phase A).
- ✅ Each run touches **less data** → lower memory/working-set as tables grow (Phase B).
- ✅ Faster dashboards for staff **today**.
- ⚠️ Won't lower **today's** ~$20 bill (data's still small) — it keeps the engine at 0.25 CU as you scale, which is the whole point.

## Suggested order

1. **Phase A caching** on the admin dashboard (biggest, most-watched) — prove the pattern, measure.
2. Phase A across finance, sales-rep/company/team analytics, logistics, data-analyst.
3. **Phase B SQL aggregation** on the heaviest scanners, as order volume climbs.
