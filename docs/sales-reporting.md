# Sales reporting

The sales manager's reports at `/sales-manager/reports`, built on the owner's
template **`docs/CRM_Sales_Reporting_Template_.pdf`**: Daily, Weekly, Monthly and
Quarterly reports, targets, data-accuracy checks, and saved (submitted) reports.

| Piece | Where |
|---|---|
| Lagos periods (day / Mon–Sun week / month / quarter) | `lib/lagos-time.ts` |
| Metric registry + template calculations | `modules/reports/sales/metrics.ts` |
| SQL core — one CTE with every per-order flag | `modules/reports/sales/sql.ts` |
| Backlog / recovered / journey / data-check predicates | `modules/reports/sales/views.ts` |
| Filters (template section 6) | `modules/reports/sales/filters.ts` |
| Report builders (one per template report) | `modules/reports/sales/builders.ts` |
| Drill-down links ↔ order lists | `modules/reports/sales/drilldown.ts`, `/sales-manager/reports/orders` |
| Services (cohort, views, targets, feedback, action items, saved reports, follow-ups) | `modules/reports/sales/services/` |
| Actions (manager writes; rep feedback + follow-ups) | `modules/reports/sales/actions/` |
| UI | `components/reports/sales/*`, `app/(sales-manager)/sales-manager/reports/*` |
| PDF | `lib/reports/sales-report-pdf.ts` (same document as the page) |

## How figures are built

**A period's figures describe the orders received in that period** — the
*cohort*: non-deleted orders whose `Order.date` falls in the Lagos day / week /
month / quarter. Handled is the cohort; confirmed, delivered, cancelled and
revenue say what has happened to *those* orders. So every rate is a true funnel
rate (≤ 100%) exactly as the template defines it. A past period's delivered and
revenue figures rise as its orders are delivered later — which is why a
**submitted report freezes its figures** (below).

Days are Lagos days (WAT, UTC+1) computed with explicit UTC arithmetic — the
servers run on UTC, so `setHours(0)` would be 01:00 Lagos.

| Metric | Definition |
|---|---|
| Handled | cohort orders |
| Confirmed | cohort orders with a `Delivery` row (created at confirmation; kept through later cancel/fail) |
| Delivered / Cancelled | `status` DELIVERED / CANCELLED |
| Pending / Backlog (funnel) | `status` PENDING, CONFIRMED or FAILED |
| Revenue (₦) | `SUM(netAmount)` of delivered cohort orders — excluding Ghana teams |
| AOV | Revenue ÷ Delivered |
| Confirmation / Delivery rate | ÷ **Handled** — never ÷ Confirmed (template rule) |
| New / Old customer | whether an earlier non-deleted order has the same **phone key** (`Customer.phoneKey`, normalised `234…`) |
| Reorder | rep-ticked `isReorder`, or an earlier **delivered** order with the same phone key |
| Upsell | a merged line with extra units of the same product (`isUpsell = false`, `upsellQuantity > 0`) |
| Cross-sell | a line the rep added for a different product (`isUpsell = true`) |
| Lead source | Form (`formId` set) or Manual |
| Team | the rep's team |
| Achievement % | Actual ÷ Target × 100 |
| Growth % | (Current − Previous) ÷ Previous × 100; Variance = Current − Previous |

Product tables count an order once under each distinct product; product revenue
is each line's `lineTotal` scaled by the order's `netAmount ÷ totalAmount`, so it
respects discounts and sums to the total.

**Backlog table** (daily) — all currently open orders: Pending Confirmation
(PENDING), Pending Delivery (CONFIRMED), Failed attempt (FAILED), Rescheduled
(open + `isRescheduled`), Unresponsive (open + latest call outcome Not Picking /
Not Reachable / Switched Off). **Recovered** = orders received before the period,
still open at its start, and confirmed or delivered during it; the funnel rate is
÷ backlog open at the start.

**Customer journey** — Day N = orders delivered N Lagos days before the report
day (Day 1 prescription, Day 2 thank-you, Day 4 feedback call, Day 7
upsell/reorder). Reps mark each done (on the order page or `/sales-rep/follow-ups`).

## Traceability

Every figure is a named SQL predicate. The report counts it and the drill-down
page (`/sales-manager/reports/orders?view=…`) lists it with the **same**
predicate and filters, so the list always has exactly as many orders as the
figure (customer figures show the distinct-customer count).

## Targets

Set per team, per metric, **separately for each day, week, month and quarter**
(`/sales-manager/reports/targets`, with "Copy from previous period"). The
company target is the sum of the team targets. Target / achievement columns are
hidden when a report is filtered below team level.

## Saved reports

The manager's written sections (backlog Action / Owner, Weekly Management
Review) save as a server draft while typing. **Submit** rebuilds the figures on
the server and stores them as a snapshot. A submitted report shows its snapshot;
if the live figures have since changed, a banner lists every difference — the
system never silently reconciles (template rule). Reopen → edit → re-submit to
take new figures. Challenges / Management Action are tracked items that stay on
every report until marked Done. Customer feedback is logged by reps on the order;
the manager sets its status and action on the report.

## Data checks (template section 7)

Flagged for review with the orders behind each; nothing is ever auto-fixed:
possible duplicates (same phone + product within 24 h), missing customer details,
no status update (pending > 48 h with no call outcome), delivered without
confirmation, revenue mismatch (total ≠ Σ lines or net ≠ total − discount),
missing delivery info, long-pending backlog (> 7 days), rescheduled and
unresponsive (tracked).

## Not tracked (and why)

- **Referrals** — orders don't record a referral; shown as "Not tracked".
- **Ghana (GHC)** — not set up. The Ghana row reads "Not set up yet". A team whose
  name contains "Ghana" is kept out of every Naira revenue total and target; GHC
  is never converted or summed with Naira.
- **Lead source** is Form vs Manual only (no channel/campaign on orders).

## Schema

Migration `prisma/migrations/20260928120000_sales_reporting/migration.sql`
(additive, idempotent; `prisma db execute`, never `db push`): `Customer.phoneKey`
(+ backfill), `Order(date)` and `Delivery(deliveredTime)` indexes, and the
`sales_targets`, `sales_reports`, `sales_action_items`, `customer_feedback`,
`customer_follow_ups` tables.
