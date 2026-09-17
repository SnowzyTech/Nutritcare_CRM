# Neon Compute Review — Where the DB Cost Actually Comes From

**Status:** Review only, no code changes. Prepared 2026-09-17.
**Scope:** Only the things with a *material* effect on Neon compute. Small stuff is deliberately left out.

---

## Plain-language summary (read this first)

Neon does **not** bill you for how much data you store — you only have 364 orders, that is tiny. Neon bills you for **how long the database "engine" is switched on**. The engine goes to sleep when no queries arrive, and wakes up (and starts the meter) the moment one does.

Your problem is that **something is knocking on the database's door 24 hours a day**, so the engine almost never gets to sleep. That "something" is mostly your **advertising order forms** — every time an ad viewer merely *opens* a form (not even orders), the page quietly writes a "someone viewed this" record to the database. With ads running around the clock, those little writes never stop, so the engine never sleeps → ~85% compute.

**Why the caching you added 3 days ago didn't help (and it got worse, 65% → 85%):**
The caching you added only covered *reading* a few things (the form, team list, warehouse list). But the thing pinning the engine awake is a *write* (the view-tracking record), and **writes can never be cached**. Meanwhile, in the same few days you shipped *more* always-on writing (failed-order logging + more embedded form placements) and likely more ad traffic. So the one lever you pulled didn't touch the real cause, and new load pushed the number up.

The single highest-value change is to **stop (or drastically slim) the per-view write on the ad forms.** Everything else is secondary.

---

## Cost of upgrading to Neon Launch (usage-based, priced 2026-09-17)

Neon's paid plans are **usage-based, no fixed tier fee** — you pay for what you use, with a **$5/month minimum**. Launch rates: **compute $0.106 / CU-hour**, **storage $0.35 / GB-month**. Neon does **not** bill per read/write/query/order — only compute-time and storage. (Sources: neon.com/pricing, neon.com/blog/new-usage-based-pricing.)

**Estimate at current usage (0.25 CU, awake ~24/7 per the graph):**

| Item | Calculation | Monthly |
|---|---|---|
| Compute | 0.25 CU × ~730 h × $0.106 | ~$19.35 |
| Storage | ~0.5 GB × $0.35 | ~$0.18 |
| Reads/writes/orders | not metered | $0.00 |
| **Total** | | **≈ $19–20/month** |

No hard cap (unlike Free) — a busy month just costs a little more; the app is never throttled. Set autoscaling **min 0.25 / max ~1 CU** to cap the ceiling.

**What #1–#3 do to this bill:** little *today* (already at the 0.25 CU floor; ads keep it awake so it can't suspend much — best case a few $/mo from overnight sleep). Their real value is **holding the engine at 0.25 CU as volume grows**, i.e. the difference between the rows below:

| Engine size (24/7) | Monthly compute |
|---|---|
| 0.25 CU (today) | ~$19 |
| 0.5 CU | ~$39 |
| 1 CU | ~$77 |

Storage pruning (#2) barely affects cost (even millions of rows ≈ a GB or two ≈ <$1/mo) — do it for table hygiene/speed, not savings.

---

## Do the #1–#3 optimizations actually help? (today vs growth)

Short answer: **yes — they are the fix for growth, not for today's bill.** Two different questions get mixed up here:

1. **"Will they lower the bill *right now*?"** → Barely. You're **already at the smallest engine Neon sells (0.25 CU)** — you can't go lower, so making light work lighter doesn't drop the price.
2. **"Will they save money/speed *as we grow*?"** → **Yes, massively. That's their whole point.**

Both are true at once; they're not a contradiction.

**Analogy — the engine is staff handling orders:**
- Today you have **one part-time worker** (0.25 CU), the smallest you can hire. They're only ~20% busy, but you still pay for one whole person — you can't hire a quarter of a person. That's why today's bill is a flat ~$20 no matter how much you optimise.
- **#1–#3 = making the work more efficient** so one worker copes with far more.
- **Without** that efficiency, growth forces you to hire a 2nd then 3rd worker (engine 0.25 → 0.5 → 1 CU; bill doubles, quadruples). **With** it, that one cheap worker keeps coping far longer → you stay at ~$20.

**Concrete picture:**

| | Today (~20 orders/day) | 20× growth, **no** optimization | 20× growth, **with** #1–#3 |
|---|---|---|---|
| Engine size | 0.25 CU | forced up to ~1 CU | still ~0.25 CU |
| Monthly cost | ~$19 | ~$77 | ~$19 |
| Page speed for staff | fine | slow (heavy uncached scans) | fine |

**And it's not only money.** Even at zero cost saving, #1–#3 also buy **speed** (cached dashboards + slimmer writes = faster pages for the 102 staff, today), **reliability** (absorbs a viral-ad traffic spike without crawling), and **clean tables** (pruning keeps the growing `FormView`/failed-attempt tables from dragging queries down).

**Honest nuance:** #1 specifically (the form-view write) *could* trim a few $/month even now — if ad traffic genuinely goes quiet overnight, removing that constant write lets the engine finally sleep in the small hours, shaving awake-hours. #2 and #3 are almost entirely future/speed, not today's bill.

---

## How Neon billing works (the mental model for every decision below)

- Compute is billed as **CU-hours = (compute size) × (time the compute is active)**.
- Neon **auto-suspends** the compute after a period with no queries. While suspended you pay ~nothing.
- Therefore the enemy is **query *frequency / spread across the clock***, not query *heaviness* and not *data volume*.
- One cheap query every few seconds, 24/7, is **far more expensive** than a big report run twice a day, because the first never lets the compute sleep.

This matches the earlier diagnosis in memory: the burn is *frequency* (102 staff + 24/7 ad-form traffic), not data size.

---

## What you're doing RIGHT (keep these — they're genuinely healthy)

These are real wins; many teams get them wrong.

1. **JWT sessions.** `session: { strategy: "jwt" }` (`lib/auth/auth.ts`) + Edge middleware (`proxy.ts`, `lib/auth/auth.config.ts`) mean **auth checks never hit the database**. Every page load being authorized without a DB round-trip is a big structural saving. Do not switch to database sessions.

2. **Pooled Neon adapter, tuned.** `lib/db/prisma.ts` uses the Neon serverless pool with sane limits (`max 10`, idle 30s, connect 10s). Good.

3. **Audit camera is out-of-band and public-safe.** `lib/audit/camera.ts` writes audit rows *after* the response, never inside the caller's transaction, and **skips writes with no authenticated user** — so your public ad-form traffic does **not** generate audit rows. That's the right design and keeps the biggest traffic source out of the audit table.

4. **Correct, scoped reads.** Explicit `select` everywhere (no `SELECT *`, password never selected), soft deletes, indexed FKs, and `groupBy` used in the right places (live form order counts, rep auto-assignment). The form read is now cached with tag invalidation and the right rules (no Decimals, no per-user data).

5. **Duplicate-order guard** prevents double writes on retries (`form-submit`).

---

## HIGH IMPACT — this is where the compute goes

### 🔴 1. The form-view beacon writes to the DB on every ad impression (the #1 cause)

**Path:** `app/order-form/[id]/order-form-client.tsx:461` fires `POST /api/forms/[id]/view` on **every** page load → `app/api/forms/[id]/view/route.ts` runs a **2-statement transaction**:

```
prisma.$transaction([
  prisma.formView.create(...),          // one row per impression, forever
  prisma.form.update({ hits: +1 }),     // plus a write to the form
])
```

Why this is the dominant cost:
- It runs on **impressions, not orders** — with 24/7 ad traffic this is your highest-frequency DB operation by a wide margin.
- It's a **write**, so **caching can never touch it** (this is exactly why the recent caching work didn't move the needle).
- It's a **transaction** (`BEGIN … COMMIT`), which is heavier and holds the compute busy longer than a single statement.
- Before doing the write it also does a `form.findUnique` — so it's really **1 read + 1 transaction of 2 writes per impression**.
- `FormView` grows **unbounded** and is only consumed by media-buyer analytics.

**This one path plausibly explains "the engine never sleeps."** It is the first thing to change.

Directions to consider (not implementing yet):
- Collapse to a **single** statement — `form.update({ hits: { increment: 1 } })` with **no `FormView` row** — if per-timestamp view analytics aren't essential. Removes the transaction and the unbounded table in one move.
- If you need time-series view data: **buffer and batch** (accumulate views in memory / an edge KV and flush one batched insert every N seconds/minutes), or **sample** (record 1 in N), or move view-tracking **off Postgres entirely** (Vercel/edge analytics, or a lightweight counter store). The goal is to convert "thousands of tiny writes" into "one small write occasionally," which lets the compute suspend between flushes.
- Drop the pre-write `findUnique`; the disabled/deleted check can be folded into an `updateMany(where: { disabledAt: null, deletedAt: null })` so it's a single conditional write.

### 🔴 2. Two more always-on writes were added *after* the caching commit

These landed in the last few commits and directly explain part of the 65% → 85% rise:

- **Failed-order logging** (`modules/orders/services/failed-attempt.service.ts`, `POST /api/orders/form-submit-failure`, fired from `order-form-client.tsx:686`) — writes a `FailedOrderAttempt` row on every failed/timed-out public submit. Public-traffic write, unbounded table.
- **Inline/embedded form code** — more embed placements ⇒ more form loads ⇒ **more of the beacon in #1**.

Neither is wrong to have, but both add to the 24/7 write stream. Fixing #1 matters most; keep #2 in mind as compounding load. Add **retention/pruning** for both `FormView` and `FailedOrderAttempt` so they don't grow forever.

### 🟠 3. Heavy dashboards recompute from scratch on every load, uncached

`modules/orders/services/admin-dashboard.service.ts` (`getAdminDashboardData`) on each admin/super-admin dashboard view runs, uncached:
- `computePeriodStats` **twice** (this month + last month), each `findMany` of all orders **with their items** then reduces in JS,
- `getMonthlyRevenue` — pulls the **whole year** of delivered orders,
- `getWeeklyOrders`, plus two `stockLevel.findMany` scans.

At 364 orders this isn't painful *yet*, but: it's **uncached**, it re-runs on **every refresh**, multiple admins hit it, and it's the pattern the scale doc flags across `analytics.service.ts`, `users.service.ts`, `data-analysis.service.ts`, `media-buyer.service.ts`, `lib/performance.ts`. During business hours this is part of the "trickle" keeping compute awake, and it's the part that **grows with order volume**.

Directions:
- **Cache the dashboard aggregates** with a short TTL (e.g. 60–300s) via `unstable_cache` — same tool you already used for forms, but pointed at the expensive scans instead of the cheap read. This is *higher leverage* than the read you cached.
- **Aggregate in SQL** (`groupBy` / `_sum` / `_count` / raw SQL) instead of `findMany().reduce()`, so less data crosses the wire and the compute does less work per call. Build all *new* reporting query-based from day one (per the scale doc).

### 🟠 4. Per-navigation user/permission lookups (the staff-side trickle)

Because App Router re-runs layouts on navigation:
- `app/(sales-rep)/layout.tsx` calls `getSalesRepById` **on every navigation** (for the sidebar avatar/name).
- Each admin section layout calls `requireAdminPageAccess` → `prisma.user.findUnique` **on every navigation** (`lib/auth/guard-admin-page.ts`), *by design* (fresh revocation check).

Each is a light single-row read, but ×102 staff browsing all day, it's a steady daytime drip that helps keep compute from sleeping. This is a *deliberate* trade-off (fresh permissions, live avatar). Worth revisiting only after #1–#3:
- The sidebar user could come from the session/JWT (already have `name`) instead of a DB read.
- The revocation check could be cached for a few seconds per user, or moved into the token with a short refresh, accepting a small staleness window.

---

## Lower impact / informational (don't spend effort here yet)

- **Audit camera doubles writes on business actions.** Every business create/update/delete triggers one extra `auditLog.create`. It's out-of-band and skips public traffic, so it is **not** your headline cost — business writes are far rarer than ad impressions. Leave it; if the audit table itself grows large, add high-churn models to `IGNORED_MODELS` and/or a retention policy.
- **Indexes** on the hot tables look fine (`Order`, `Notification`, `AuditLog`, `FormView` all indexed on `formId`/`createdAt`/FK). No index gap is driving compute today.
- **`getAllForms`** does a `findMany` + a `groupBy` order-count; fine at current scale, revisit if forms/orders balloon.

---

## Recommended order of attack (highest ROI first)

1. **Slim or remove the per-impression form-view write (#1).** Biggest single lever — targets the thing keeping the compute awake 24/7. Aim to turn thousands of tiny writes into occasional batched ones, or drop the per-row insert entirely.
2. **Trim the two newer always-on writes + add retention** to `FormView` and `FailedOrderAttempt` (#2).
3. **Cache and/or SQL-aggregate the dashboards** (#3) — reuse the `unstable_cache` pattern you already have, aimed at the expensive scans.
4. **Confirm the Neon settings & tier (#Measure below).** Even after the above, decide whether always-on paid compute is simply cheaper/steadier than fighting for suspension — the earlier plan to move off the free tier still stands.
5. **Only then** revisit the per-navigation staff lookups (#4).

---

## CONFIRMED by the Neon compute graph (2026-09-17)

The Neon Monitoring → Compute graph settles it. Over a full 24h window (Free plan, `production` compute):
- The **RAM line is flat and continuous** — RAM is only allocated while the engine is awake, so the compute is **on ~24/7 and almost never suspends.**
- Exactly **one "ENDPOINT INACTIVE" band** (~1–2 AM) all day — the only time it slept.
- The compute is already at the **minimum 0.25 CU** size. So this is a **"never sleeps"** problem, not a "too big / heavy query" problem.

**The math that explains "85%":** Free plan ≈ 192 compute-hours/month; 0.25 CU × 720 h/month ≈ **180 CU-hours ≈ 94% of the whole free allowance just from staying awake.** A database queried around the clock **cannot** fit inside the free tier, no matter how well the code is tuned.

**Consequences for the plan above:**
- **#4 (upgrade to Neon Launch) is now the PRIMARY fix, not the eventual one.** An always-on production DB is normal and healthy; the free allowance simply isn't sized for it. Code tuning cannot make a 24/7-traffic DB suspend enough to fit 192 hrs.
- **#1–#3 still matter — but for a different reason:** on the paid plan Neon autoscales and bills size × time. Keeping load light (slim the form-view write, cache the dashboards) keeps you pinned at the cheap **0.25 CU** instead of scaling to 0.5/1 CU. They control the *size/cost*, not the *awake time*.
- **Why optimising won't make it suspend:** Neon sleeps only after ~5 min with zero queries. With ads delivering traffic overnight there's rarely a 5-min gap, so it stays awake regardless. Upgrading is the fix.

To pinpoint it in the Neon console:
- **Monitoring → Compute** graph: does the compute **ever drop to suspended**, or is it a flat line? A flat line = the beacon (#1) is the cause.
- Enable **`pg_stat_statements`** and look at **calls** (frequency), not just total time. The top row by `calls` is almost certainly the `form_views` insert / `forms` update. That confirms #1 empirically before you touch code.

---

*Everything above is observation and recommendation only — no code was changed.*
