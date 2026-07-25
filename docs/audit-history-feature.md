# System-wide Audit History

A robust, filterable audit trail so the CEO can review every action across the system
each day — filter by department and by day, and see admin activity too.

## Data model

`AuditLog` (`prisma/schema.prisma`) gained:
- `actorName String?`, `actorRole String?` — denormalized actor snapshot (survives user
  rename/deletion, drives the department filter). Indexed on `actorRole` and `action`.
- `details Json` reused for `{ description, before?, after?, field?, amount? }`.

Columns/indexes applied via targeted SQL (not `prisma db push`, to preserve a colleague's
drifted `supplierInvoiceUrls` column). Backfill: `prisma/backfill-audit-actor.ts`.

## Logging

`modules/audit/services/audit-log.service.ts` — `logActivity()` is fire-and-forget. It
auto-fills `actorName/actorRole` from the user if not passed, and accepts structured
`details` (before/after/amount). Call it at the end of any successful mutation:

```ts
await logActivity({
  userId, action: "Discount", entityType: "Order", entityId: order.id,
  description: `Discount applied to #${order.orderNumber}`,
  details: { before, after, field: "price", amount },
});
```

## Query + UI

- `modules/audit/services/audit-query.service.ts` — `getPersonalActivity`,
  `getGeneralActivity` (department/date/search + cursor), `getDailySummary`,
  `getActivityForExport`. Department → roles via `ROLE_TO_UI_DEPT` + `MEDIA`/`ADMIN` buckets.
- `app/(admin)/admin/history/page.tsx` + `history-client.tsx` — tabs (Personal / General),
  Department + Date + search filters (URL-driven), day-grouped table
  (Date · Name+department · Action · Description), before/after expandable rows, a daily
  summary scoreboard (General), and CSV/print(PDF) export
  (`modules/audit/actions/audit-export.action.ts`). Both admin tiers can view General.

## Coverage (complete across all modules)

- **Orders / Sales rep** — create, confirm, cancel, fail, revive, discount (before/after),
  deliver, reassign agent, add/remove items; admin counterparts incl. bulk reassign.
- **Accounting / Finance** — remittance, settlement adjustment, expense, invoice, journal,
  payroll, cost-price + delivery-fee (before/after), supplier CRUD, fixed-asset
  create/dispose/delete, payment-account CRUD, expense-category create.
- **Inventory** — stock adjustments (create/approve/reject/reverse/delete); incoming,
  outgoing, transfer movements (create/update/reverse/delete); returns update/delete;
  product/supplier/agent/warehouse/category create + update + delete.
- **Warehouse** — goods-receipt confirm, incoming/outgoing/return create/reverse/delete,
  pick-pack assign + create packer, receive transfer, shelf-zone add/remove.
- **Logistics / Delivery** — agent + driver create/delete, dispatch, delivery status update,
  agent portal: mark delivered/failed, reschedule, delivery-fee change, password change.
- **Data** — analyst mark delivered/failed, permanent order delete.
- **Media buyer** — form create/update/delete/duplicate/disable.
- **Auth** — login/logout, signup.

For actions performed on behalf of a sales rep (delivery agent / analyst marking an order
delivered/failed), the log is kept under the sales rep's `userId` (so it stays in their
Personal History) while `actorName`/`actorRole` record the actual actor for the General view.

**Intentionally not logged:** chat messages, notification read toggles, passive
occupancy/profile tweaks. **Deferred:** failed-login capture (needs nullable
`AuditLog.userId`), tamper-proof hash-chaining.
