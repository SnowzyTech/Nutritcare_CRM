# Hybrid audit logging (auto camera + rich manual events)

Audit coverage is **automatic**: a Prisma client extension (the "camera") records every
business-entity `create`/`update`/`delete` into `audit_logs` with no per-action code, so new
features and modules are captured for free. A small set of high-value events additionally
keep rich hand-written `logActivity` entries (descriptions, before/after, amounts).

## Pieces

- `lib/db/prisma.ts` — `basePrisma` (private, un-extended) + `prisma = basePrisma.$extends(camera)`.
  App code imports `prisma`; the audit layer writes via `basePrisma`.
- `lib/audit/camera.ts` — the extension. Logs writes for business models; **skips**
  `IGNORED_MODELS` (derived/child/system tables: StockLevel, OrderItem, Notification,
  Delivery, chat, NextAuth, …). Recursion-safe (writes via `basePrisma`), out-of-band, and
  respects the suppression flag.
- `lib/audit/actor.ts` — `getCurrentActor`: `cache()`-memoized `auth()` (once per request),
  `null` outside a request → the write is skipped (keeps the `userId` FK valid).
- `lib/audit/context.ts` — `withoutCameraAudit(fn)`: request-scoped suppression so a rich
  manual flow isn't also auto-logged.
- `lib/audit/schedule.ts` — `runAfterResponse(fn)`: runs the audit write via Next `after()`
  (post-response), so it never sits in the caller's transaction or adds latency; detached
  fallback in script contexts.
- `modules/audit/services/audit-log.service.ts` — `logActivity` writes via `basePrisma`,
  out-of-band.

## Safety properties

- **No recursion** — audit rows written via `basePrisma`; `AuditLog` also in the ignore set.
- **No Neon-timeout / no crashing** — audit work runs after the response, never inside the
  business transaction; every write is try/caught and can't throw into business logic.
- **Log-on-success (phantom-free)** — direct writes only log after they resolve; transactional
  rich flows log on the success path and suppress the camera, so a rollback logs nothing.

## De-duplication — how single rows are kept (WORKING, camera ON)

An instrumented action would emit *two* rows — its rich `logActivity` row and the camera's
generic auto-row. To prevent that, each instrumented action calls `suppressCameraForRequest()`
**in its own body**, before its DB writes; the camera checks `isCameraSuppressed()` at
write-time and stays silent for that action. Non-instrumented and future actions don't call it,
so they get the automatic camera row.

Suppression uses **AsyncLocalStorage** (`lib/audit/context.ts`), whose store propagates through
`await` into the Prisma extension — unlike React `cache()`, which does **not** cross that
boundary (an earlier `cache()`-based flag silently failed).

**Placement matters:** `suppressCameraForRequest()` uses `AsyncLocalStorage.enterWith`, which
only affects the current async execution and its descendants. It must be called **directly in
the action body**, *not* inside an awaited auth guard (`requireAuth`, `checkAdmin`, …) — a call
made inside the guard does not propagate back to the action's writes. (This bit us once: the
guard-suppressed files double-logged until the call was moved into each action body.)

## Env flag

`AUDIT_CAMERA` = `off | shadow | on`
- `on` (current) — camera auto-logs everything not in `IGNORED_MODELS`; instrumented actions
  suppress it and keep their rich row → clean single rows.
- `shadow` — identical at runtime; a label for a verification window.
- `off` — kill-switch; camera disabled, app behaves as the pure-manual system did.

## Scalability

- **New modules / files** (sales-rep-manager, accounting-manager, …) — captured automatically
  by the camera with **no audit code**.
- **A rich event** (needs description / before-after / amounts) — call
  `suppressCameraForRequest()` in the action body, then `logActivity(...)`:

```ts
export async function doThing(input) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  suppressCameraForRequest();                 // ← in the action body, before writes
  await prisma.$transaction(async (tx) => { ...writes... });
  await logActivity({ userId: session.user.id, action: "Discount",
    entityType: "Order", entityId, description: "…", details: { before, after, amount } });
}
```

`withoutCameraAudit(fn)` (callback-wrapping form) is also available if you prefer to scope
suppression to specific writes.

## Env flag

`AUDIT_CAMERA` = `off | shadow | on`
- `on` — production. Camera auto-logs everything not in `IGNORED_MODELS`; instrumented
  actions keep their rich row + suppress the camera → clean single rows.
- `shadow` — identical to `on` at runtime; a label for the verification window.
- `off` — kill-switch; camera disabled, app behaves as the pure-manual system did.

## Scalability

- **New modules / files** (e.g. sales-rep-manager, accounting-manager) — captured
  automatically by the camera, **no audit code needed**.
- **A rich event needing description / before-after / amounts** — call `logActivity(...)` and
  ensure `suppressCameraForRequest()` runs first (adding it to the file's guard is enough):

```ts
suppressCameraForRequest();               // usually already in the shared guard
await prisma.$transaction(async (tx) => { ... });
await logActivity({ userId, action: "Discount", entityType: "Order", entityId,
  description: "…", details: { before, after, amount } });
```

- **Caveat:** adding a *new* action to an existing file whose guard already calls
  `suppressCameraForRequest()` means that action is suppressed too — give it its own
  `logActivity`, or move the suppress call out of the guard to per-action.
