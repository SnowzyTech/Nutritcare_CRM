# Plan — Fix #1: The Form-View Write (the 24/7 compute drain)

**Status:** Phase 0 + Phase 1 IMPLEMENTED & migrated to prod (2026-09-17). Code awaits deploy. Phase 2 deferred.
**Companion to:** `docs/db-compute-review.md` (finding #1).
**Do this AFTER upgrading to Neon Launch** — the upgrade removes the free-tier ceiling; this keeps the paid engine pinned at the cheap 0.25 CU as you grow.

> **Progress (2026-09-17):**
> - **Phase 0** shipped, then **superseded by Phase 1** (the beacon body was replaced entirely by the daily upsert).
> - **Phase 1 done:** `form_view_daily` created in **prod** via `scripts/add-form-view-daily.ts --apply` (raw SQL, no `db push`); backfilled 9,334 legacy `form_views` → 220 daily rows (totals matched exactly). Beacon now upserts the daily tally; `getAllForms` + both media-buyer analytics services repointed; `FormViewDaily` added to audit `IGNORED_MODELS`. Verified with `scripts/verify-form-view-daily.ts` (per-form daily tally == legacy `Form.hits`). Type-checks clean.
> - **Remaining:** deploy the code. Table exists in prod first (safe ordering), so deploy whenever. Old `form_views` is kept (read-only, no longer written) as a safety net; prune later. Minor cosmetic gap: views landing between the backfill and the code deploy are recorded in `form_views` (old code) but not `form_view_daily` — negligible if you deploy promptly.

---

## Plain-language goal

Every time an ad viewer *opens* a form, the app writes a "someone viewed this" record to the database. With ads running 24/7 that write never stops, which is the main thing keeping the database engine awake and doing work. This plan makes that view-counting **far cheaper and stops it growing forever**, without losing any of the numbers the media-buyers rely on (views, leads, delivered, conversion rate).

**Honest expectation setting (what this does / doesn't do):**
- ✅ Cuts the *work per view* ~3× (no pre-read, no transaction).
- ✅ Stops the `form_views` table growing without limit → keeps it and the media-buyer dashboards fast forever.
- ✅ Makes the analytics reads cheap (tiny aggregates instead of scanning every view row).
- ⚠️ **Does not, by itself, make the engine sleep** — it's still one write per view, so the engine stays awake while ads run. Actually *reducing awake-time* needs Phase 2 (below), which is only worth doing if the bill later climbs.

So Phases 0–1 are about **keeping compute small + tables clean as you scale** (the ~$19 → not-$40 story from the review). Phase 2 is the awake-time lever, deferred until data says it's needed.

---

## Current state (what exists today)

**Trigger** — `app/order-form/[id]/order-form-client.tsx:458-462`: on load, if the form is embedded in an iframe, fires once:
```
fetch(`${apiBase}/api/forms/${formId}/view`, { method: "POST" })
```

**Endpoint** — `app/api/forms/[id]/view/route.ts`: per view it does **1 read + a 2-statement transaction**:
```
const form = await prisma.form.findUnique(... disabledAt, deletedAt ...);   // read
if (disabled/deleted) return;
await prisma.$transaction([
  prisma.formView.create({ data: { formId } }),        // one row PER view, forever
  prisma.form.update({ hits: { increment: 1 } }),      // denormalised counter
]);
```

**Who reads the view data** (must keep working):
| Reader | File | What it needs |
|---|---|---|
| Media-buyer performance | `modules/media-buyer/services/media-buyer.service.ts:125` | views per form, within a date range (`groupBy formId`) |
| Media-buyer totals | `media-buyer.service.ts:205` | total views (`count`) |
| Media-buyer trend (current vs previous window) | `media-buyer.service.ts:304` | views per form, bucketed by day/window |
| Media-buyer analysis | `modules/data-analysis/services/media-buyer-analysis.service.ts:254` | views bucketed by day/window |

**Who reads `form.hits`** (the denormalised counter):
`modules/admin/services/forms.service.ts` (`getAllForms`, `getPublicFormById`, `PublicForm` type), `components/dashboard/forms/FormsListClient.tsx:354`, `app/(admin)/admin/forms/page.tsx:14`, `app/order-form/[id]/page.tsx:25`, `embed/entry.ts:37,94`, `lib/formsStore.ts:5`.

**Key realisation:** every analytics reader only ever **aggregates views into date windows (day granularity)** — none needs an individual, per-second view row. So per-impression rows are pure waste: we can store **one counter per form per day** and lose nothing.

---

## Phase 0 — Immediate, zero-migration (ship today, ~15 min)

Just make the existing endpoint cheaper. No schema change, no risk to analytics.

**In `app/api/forms/[id]/view/route.ts`:** drop the pre-read `findUnique` and the transaction. Fold the disabled/deleted check into a single conditional write, then only insert the view if the form was live:
```
// 1 conditional write instead of 1 read + a 2-statement transaction
const updated = await prisma.form.updateMany({
  where: { id, disabledAt: null, deletedAt: null },
  data: { hits: { increment: 1 } },
});
if (updated.count === 0) return NextResponse.json({ ok: false }, { headers: CORS_HEADERS });
await prisma.formView.create({ data: { formId: id } });
```
- Removes the pre-read and the `BEGIN/COMMIT` overhead. ~⅓ less work per view immediately.
- Everything downstream is unchanged (still writes a `FormView` row + `hits`).
- **This is a safe stopgap, not the real fix** — the table still grows unbounded. Proceed to Phase 1.

---

## Phase 1 — The structural fix: daily aggregate (the real Phase-1)

Replace "one row per impression" with "one counter per form per day."

### 1. New table (add via **raw SQL**, not `db push`)
> ⚠️ Schema-drift gotcha (`docs`/memory): `prisma db push` is blocked by the drifted `StockMovement.supplierInvoiceUrls` column and can report data-loss. **Add the new table with targeted raw SQL**, then reflect it in `schema.prisma` and run `prisma generate`. Never `db push --accept-data-loss`.

```prisma
model FormViewDaily {
  id        String   @id @default(cuid())
  formId    String
  day       DateTime @db.Date          // date bucket (UTC midnight)
  count     Int      @default(0)
  form      Form     @relation(fields: [formId], references: [id], onDelete: Cascade)
  @@unique([formId, day])
  @@index([day])
  @@map("form_view_daily")
}
```
Raw SQL to run against Neon (create table + unique index). Run scripts with the **Neon DNS workaround** (memory `neon-dns-servfail-workaround`): `node --env-file=.env ...` forcing DNS via 8.8.8.8.

### 2. Backfill from existing `form_views` (one-off script)
Aggregate historical rows so analytics don't regress:
```
INSERT INTO form_view_daily (id, "formId", day, count)
SELECT gen_random_uuid()::text, "formId", date_trunc('day', "createdAt"), count(*)
FROM form_views GROUP BY "formId", date_trunc('day', "createdAt")
ON CONFLICT ("formId", day) DO UPDATE SET count = excluded.count;
```
Dry-run count first; validate a few forms' totals match `form.hits`.

### 3. Beacon endpoint → single upsert
`app/api/forms/[id]/view/route.ts` becomes **one statement, no pre-read, no transaction, no unbounded growth**:
```
const day = new Date(); day.setUTCHours(0, 0, 0, 0);
await prisma.formViewDaily.upsert({
  where: { formId_day: { formId: id, day } },
  create: { formId: id, day, count: 1 },
  update: { count: { increment: 1 } },
});
```
Drop the disabled/deleted pre-read: a stray view on a just-disabled form is harmless (new *orders* are still blocked fresh at submit time). If you want to keep the guard, make it the same single conditional write against a live-form check — but simplest is to accept the counter.

### 4. Retire `form.hits` → derive it (keeps the beacon to ONE write)
Instead of maintaining a second `hits` counter (which would mean two writes per view again), **derive total hits from the aggregate** — exactly the pattern `getAllForms` already uses to derive live order counts.
- `getAllForms` (`forms.service.ts`): add a `formViewDaily.groupBy({ by: formId, _sum: count })` alongside the existing order `groupBy`; map `hits = sum`.
- `getPublicFormById` / public form / embed: these show `hits` to internal staff only, not customers — either derive it once or pass `0`/omit (verify `order-form-client.tsx` doesn't display it to buyers; it doesn't need to).
- Update `PublicForm` type + `FormsListClient.tsx:354` + `app/(admin)/admin/forms/page.tsx:14` + `embed/entry.ts` to read the derived value.
- Once nothing reads `form.hits`, leave the column in place (harmless) or drop it later via raw SQL.

### 5. Repoint the 4 analytics readers to the aggregate
Swap `prisma.formView.*` for `formViewDaily` — and they get *cheaper*, since the rows are already pre-summed by day:
- `media-buyer.service.ts:125` `groupBy formId _count` → `groupBy formId _sum:{count}` on `formViewDaily`, same `day`-range filter.
- `media-buyer.service.ts:205` `count` → `aggregate _sum:{count}`.
- `media-buyer.service.ts:304` & `media-buyer-analysis.service.ts:254` `findMany({createdAt})` → `findMany({ select:{ formId, day, count }})` and bin by `day` (windows are day-based already, so bucketing logic barely changes).

### 6. Housekeeping
- Add `FormViewDaily` to `IGNORED_MODELS` in `lib/audit/camera.ts` (high-churn, derived — like `FormView` already is).
- After Phase 1 is verified in prod, **stop writing to `form_views`** and either keep it read-only for a grace period or drop it via raw SQL. This is what finally ends the unbounded growth.

---

## Phase 2 — Cut write *frequency* to reduce awake-time (DEFER — only if the bill climbs)

Phase 1 still writes once per view, so the engine stays awake while ads run. If, after upgrading + Phase 1, the Neon bill still grows because compute never sleeps, add ONE of these (in rising order of effort):

1. **Client sampling** — record only 1 in N views (e.g. 20%) and multiply the stored count back up in display. Exact leads/orders are untouched (those are separate, exact writes); only the vanity "views" number becomes a close estimate. Cuts write frequency ~5× with no new infra. Cheapest awake-time lever.
2. **Edge/KV buffer + cron flush** — increment a counter in Vercel KV / Upstash on each view; a scheduled job flushes aggregated counts to `form_view_daily` every few minutes. This genuinely lets Postgres sleep between flushes. Adds a KV dependency + a cron.
3. **Move impression tracking off Postgres entirely** — a web-analytics product (Vercel Analytics / Plausible / PostHog) owns views; Postgres only ever sees orders. Biggest win; changes where media-buyers read view numbers.

Do not build Phase 2 pre-emptively — it adds moving parts. Phase 1 + the paid tier is the right stopping point until real numbers justify more.

---

## Testing / rollout checklist

- [ ] Phase 0 shipped and beacon still 200s from an embedded iframe (check Network tab on a live landing page).
- [ ] New `form_view_daily` table created via raw SQL; `schema.prisma` updated; `prisma generate` run.
- [ ] Backfill run; spot-check 3 forms: `SUM(count)` ≈ old `form.hits` and old `form_views` counts.
- [ ] Beacon upsert verified: open a form twice on the same day → one row, `count` = 2.
- [ ] Media-buyer dashboard + data-analysis media-buyer report show the same view/conversion numbers as before the change (compare a known period).
- [ ] Admin forms list "Hits" column matches.
- [ ] `FormViewDaily` added to `IGNORED_MODELS`.
- [ ] Neon graph checked a day later: `form_view_daily` write is the only per-view DB op; `form_views` no longer growing.

## Rollback

Phase 0 is trivially revertible (restore the transaction). Phase 1: keep writing to both `form_views` and `form_view_daily` for a short dual-write window if you want zero-risk cutover, then flip analytics to the aggregate and stop dual-writing once verified. The old `form_views` table is untouched by the backfill, so reverting analytics to read it is always possible.

## Files this touches (reference)

- `app/api/forms/[id]/view/route.ts` — beacon (Phase 0 + Phase 1)
- `prisma/schema.prisma` — add `FormViewDaily` (+ `Form` relation)
- `modules/admin/services/forms.service.ts` — derive `hits`, `PublicForm` type
- `modules/media-buyer/services/media-buyer.service.ts` (:125, :205, :304) — repoint reads
- `modules/data-analysis/services/media-buyer-analysis.service.ts` (:254) — repoint reads
- `components/dashboard/forms/FormsListClient.tsx`, `app/(admin)/admin/forms/page.tsx`, `app/order-form/[id]/page.tsx`, `embed/entry.ts`, `lib/formsStore.ts` — `hits` display sources
- `lib/audit/camera.ts` — add `FormViewDaily` to `IGNORED_MODELS`
- backfill + raw-SQL migration scripts under `scripts/` (run with the Neon DNS workaround)
