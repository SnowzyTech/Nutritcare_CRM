# Scope — Server-side pagination for the Orders lists

**Status:** Scoped 2026-09-17. **Phase 1 (data-analyst Orders) IMPLEMENTED** — server-side filter + pagination live in code; builds clean; awaits manual QA + deploy. Other surfaces pending.
**Companion to:** `docs/db-compute-review.md` + `docs/scale-considerations.md` ("Paginate any unbounded list").

> **Progress (2026-09-17) — Phase 1 done for `data/order`:**
> - **Server foundation** (`modules/data-analysis/services/data-analysis.service.ts`): `getOrdersPage(filters, page, pageSize)` → `{ rows, total, statusCounts }` (findMany skip/take + count + status groupBy in one round trip); `buildOrderWhere` translating all 8 filters; shared `ORDER_ROW_SELECT`/`toOrderRow` so paged + full lists return identical rows. **Reusable by every other order list.**
> - **Date filter = Option B (per-status date preserved):** delivered→deliveredTime, confirmed→delivery.createdAt, failed→delivery.updatedAt, cancelled→order.updatedAt, pending→createdAt; only selected statuses' branches included; no-delivery rows fall back to updatedAt.
> - **Page** (`app/(data-analysis)/data/order/page.tsx`): reads `?status&q&product&state&team&agent&rep&from&to&page`, calls `getOrdersPage`, passes one page + total + counts + parsed filters.
> - **Client** (`OrdersClient.tsx`): all dropdowns unchanged; filter state seeded from the URL; one debounced effect syncs state → URL (`router.replace`) → server refetches the page. Tab badges + pagination read server `statusCounts`/`total`. Select-all now = current page.
> - Type-checks + `npm run build` pass.
>
> **Behavior changes to verify in QA (all defensible, some improvements):**
> - Product filter now matches an order with **any** item of that product (was: first item only).
> - Status tab counts now reflect the **other** active filters (was: unfiltered totals).
> - Filtering/paging now costs a ~300ms-debounced server round-trip (was: instant in-browser).
> - Rare: a delivered order with a delivery row but null deliveredTime isn't matched by the date filter (falls outside the primary source).
>
> **Remaining:** admin Orders, then the scoped per-rep/agent/team lists (reuse `getOrdersPage` with a `baseWhere`).

## Plain-language summary

Today, when someone opens an Orders page, the server loads **every matching order out of the database** and sends them **all** to the browser; the browser then does the searching, filtering, and "page 1 / 2 / 3" splitting in memory. At 364 orders that's fine. At 50,000+ it means every visit hauls the whole orders table into memory and down the wire — slow pages, big payloads, and the exact "load everything into RAM" pattern that pushes Neon's engine to a bigger, pricier size.

The fix: **the server sends only the 15 rows for the page you're on**, and the database does the filtering. This is a real refactor (not a one-line `take`), because all the filter logic currently lives in the browser and must move to the server.

## The current pattern (grounded in code)

- `modules/orders/services/orders.service.ts` — **every** list function is `prisma.order.findMany({ ... })` with **no `take`/`skip`**: `getAllOrders`, `getAdminOrders`, `getSalesRepOrders`, `getOrdersBySalesRep`, `getOrdersByAgent`, `getTeamOrders`, `getAssignableOrders`. Each returns the full set.
- `modules/data-analysis/services/data-analysis.service.ts` — `getOrderRows(where)` / `getAllOrders()` likewise fetch every matching order.
- The client (`app/(data-analysis)/data/_components/OrdersClient.tsx`) receives `initialOrders` = **all** orders and does everything in memory:
  - **Filters (8):** status (multi), free-text search (name/email/sales-rep), product (multi), state (multi), team (multi), delivery-agent (multi), CS-agent/sales-rep (multi), date range (by status-date).
  - **Status tab counts** (All/Pending/Confirmed/Delivered/Cancelled/Failed) — counted from the full array.
  - **Pagination** — `filteredOrders.slice((page-1)*15, page*15)`, 15/page.
  - **Bulk select + delete** — a `Set` of ids chosen from the in-memory filtered list.

So the work isn't "add a limit" — it's **inverting the model**: filters move from browser state → URL/server query, and the server returns one page + the counts.

## Surfaces (all follow the same fetch-all pattern)

| Surface | Page | Service today |
|---|---|---|
| Data-analyst Orders (richest — full 8-filter suite) | `data/order` | `getAllOrders`→`getOrderRows` |
| Admin Orders | `admin/orders` | `getAdminOrders` |
| Sales-rep Orders | `sales-rep/orders` | `getSalesRepOrders` |
| Sales-rep-manager Orders / order-assignment / [repId]/orders | `sales-rep-manager/*` | `getTeamOrders`, `getAssignableOrders`, `getOrdersBySalesRep` |
| Admin staff → rep / delivery-agent orders | `admin/staff/**/orders` | `getOrdersBySalesRep`, `getOrdersByAgent` |
| Data-analyst → per-rep orders | `data/sales-reps/[id]/order` | `getOrderRows(where)` |
| Order-assignment boards | `admin/orders/order-assignment` | `getAssignableOrders` |

They split into **rich lists** (data-analyst + admin: full filter suite) and **scoped lists** (per-rep/agent/team: same rows, fewer filters). Both need server pagination; the rich ones are the larger lift.

## Target design

### 1. A reusable paged query (one place, used by all surfaces)
Add to the orders service:
```ts
type OrderListFilters = {
  status?: OrderStatus[]; search?: string; productIds?: string[];
  states?: string[]; teamIds?: string[]; agentIds?: string[];
  salesRepIds?: string[]; from?: Date; to?: Date;
  baseWhere?: Prisma.OrderWhereInput;      // per-surface scope (salesRepId, agentId, team members…)
};

async function getOrdersPage(
  filters: OrderListFilters,
  page: number,
  pageSize = 15,
): Promise<{ rows: OrderRow[]; total: number; statusCounts: Record<string, number> }> {
  const where = buildOrderWhere(filters);   // translates every filter into Prisma `where`
  const [rows, total, grouped] = await Promise.all([
    prisma.order.findMany({ where, orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize, take: pageSize, select: ORDER_ROW_SELECT }),
    prisma.order.count({ where }),
    prisma.order.groupBy({ by: ["status"], where, _count: { _all: true } }), // tab counts, SQL-side
  ]);
  return { rows: rows.map(toOrderRow), total, statusCounts: fromGrouped(grouped) };
}
```
- Search across name/email/sales-rep → `OR` of `contains` (case-insensitive). For big tables later, a proper text index or a search column; `contains` is fine at first.
- Reuse the existing `OrderRow` mapping so the table's row shape is unchanged.

### 2. Filters live in the URL (server-readable)
Move filter state into `?status=&q=&product=&state=&team=&agent=&rep=&from=&to=&page=` (the codebase already parses `searchParams` on server pages — e.g. the admin dashboard). Benefits: the **server component** can read them and call `getOrdersPage`; pages become shareable/bookmarkable; back/forward works. The client updates the URL (debounced for search) instead of local state.

### 3. Pagination style: **offset** (`skip`/`take`)
Keeps the existing "page 1 … N" UI and the total-count/"page X of Y" display. Simple and correct. (Keyset/cursor is more efficient at very deep pages but changes the UX and can't jump to page N — revisit only if deep paging becomes hot.)

## Behaviour / UX changes to plan for

- **Filtering now costs a server round-trip** (vs instant in-browser). Mitigate: debounce search (~300ms, the codebase already debounces elsewhere), keep filters in the URL, show a subtle loading state. Net still far faster than shipping the whole table.
- **Status tab counts** come from a `groupBy` (indexed, cheap) instead of counting the full array — and now reflect the *filtered* set, which is usually what users expect (decide: counts of All vs counts within current filters).
- **Bulk select + delete** needs a decision: today "select" picks from the in-memory list. With server paging, either (a) select-within-current-page only, or (b) add an explicit "select all N matching" that runs the delete by **filter** server-side (not by a client-held id list). Recommend (a) first; (b) later if needed. (Note: data-module delete is PENDING-only per `[[data-order-deletion-policy]]`.)
- **Indexes:** confirm indexes back the hot filter/sort columns — `Order.createdAt` (sort), `status`, `salesRepId`, `agentId`, `formId`, and `customer.state` (via the customer join). Add composite indexes for the common `(status, createdAt)` / `(salesRepId, createdAt)` access paths before high volume.

## Why NOT just cache these (unlike the dashboards)

Dashboards are a handful of fixed aggregates → cacheable. Orders lists are **user-filtered, high-cardinality, and mutate constantly** → caching would be mostly misses and stale rows. **Pagination is the right tool here, not caching.**

## Priority / phasing

1. **Data-analyst Orders** (`data/order`) — richest + heaviest; build `getOrdersPage` + `buildOrderWhere` here first and prove the URL-filter pattern.
2. **Admin Orders** — reuse the same helper.
3. **Scoped lists** (per-rep / per-agent / per-team / assignment) — reuse the helper with a `baseWhere`; fewer filters, quick once the pattern exists.

## Effort & what it achieves

- **Effort:** medium-to-large per rich surface (invert filter model + URL wiring + table refetch), small for scoped surfaces once the helper exists. Order-row shape stays the same, limiting UI churn.
- ✅ Page loads become **flat and fast** regardless of table size (15 rows, not all) — a real improvement **today**, not just later.
- ✅ Removes the "load the whole orders table into memory" pattern → protects the **memory/working-set** signal that scales Neon's compute as orders grow.
- ⚠️ Won't lower **today's** ~$20 bill (data's still small); it's scale-proofing + a UX/perf win now.
