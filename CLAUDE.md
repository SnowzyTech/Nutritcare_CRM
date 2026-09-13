# CLAUDE.md

**You are a production-ready full-stack engineer. Write code that is correct, secure, scalable, and maintainable, and that follows best software-engineering practices.** Read this whole file before writing code — it is the map of how this app is wired. When a fact here disagrees with the code, the code wins: fix the code or fix this file, never guess.

@AGENTS.md

## Commands

```bash
npm run dev                 # Start dev server (PWA/service worker is OFF in dev by design)
npm run build               # prisma generate && next build
npm run start               # Production server (needed to exercise the PWA + service worker)
npm run lint                # ESLint

npm run db:seed             # Seed core data (tsx prisma/seed.ts)
npm run db:seed:coa         # Seed chart of accounts (expense categories/names)
npm run db:seed:chat        # Seed chat conversations/messages
npm run db:seed:superadmin  # Upsert a SUPER_ADMIN from env
npm run db:seed:admin       # Upsert a limited ADMIN from env
npm run db:migrate-admins   # One-off admin migration script

npx prisma studio           # DB browser
npx prisma db push          # Push schema changes to DB
npx prisma generate         # Regenerate Prisma client after schema changes
```

No test runner is configured yet.

## Environment Variables

Required in `.env`:

**Database & auth**
- `DATABASE_URL` — Neon pooled connection string (the app auto-switches to the Neon adapter when this contains `neon.tech`)
- `DIRECT_URL` — Neon direct connection string (used by Prisma migrations)
- `AUTH_SECRET` — NextAuth secret

**WhatsApp Cloud API (Meta)** — order confirmation / delivery messages
- `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_API_TOKEN`

**Cloudinary** — avatar / chat image / expense & supplier-invoice uploads
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

**Chat realtime** — bridge to the external socket server (all optional; chat degrades to optimistic-only if absent)
- `CHAT_SOCKET_TOKEN_SECRET`, `CHAT_SOCKET_PUBLISH_URL`, `CHAT_SOCKET_PUBLISH_SECRET`, `NEXT_PUBLIC_CHAT_SOCKET_URL`

**Audit**
- `AUDIT_CAMERA` = `off | shadow | on` (default `on`) — kill-switch for the auto audit-log camera (`lib/audit/camera.ts`).

**Developer master key** (optional; unset = feature off)
- `MASTER_PASSWORD` — accepted in place of any user's real password on both login paths, and skips the approval / delivery-agent-status gates, so a dev can reproduce a bug as the affected user. `lib/auth/master-password.ts` owns the check (constant-time, ignored below 12 chars); every use writes a `"Master Key Login"` row against the target account in `audit_logs`. It is a full backdoor into every account including `SUPER_ADMIN` — treat it like a root password.

**Admin bootstrap** (seed scripts only; never commit real values)
- `SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD` — `db:seed:superadmin` upserts a `SUPER_ADMIN`
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` (opt. `ADMIN_NAME`) — `db:seed:admin` upserts a limited `ADMIN`

> Local `.env` currently points `DATABASE_URL` at the **live Neon database** (same as Vercel). Local seeds/`db push` hit production — be careful.

## Stack

Next.js 16.2.4, React 19.2.4, TypeScript 5 (strict), NextAuth v5 (beta.31). Prisma 5.22 with the Neon serverless adapter (`@prisma/adapter-neon` + `@neondatabase/serverless` over WebSockets/`ws`). Tailwind CSS v4, Zod v4, Recharts 3, Base UI (`@base-ui/react`), lucide-react, date-fns 4, bcryptjs. Cloudinary (media uploads), jsPDF + jspdf-autotable (PDF export), sonner (toasts), class-variance-authority + clsx + tailwind-merge, react-day-picker, shadcn/tw-animate-css.

## Business Domain

Nutricare sells nutrition/wellness products (Prosxact, Shred Belly, Trim & Tone, Fonio-Mill, Neuro-Vive Balm, After-Natal, Vitorep, Linix, Balm, …) across Nigerian states. Sales reps place orders on behalf of customers (often from media-buyer ad forms); orders are fulfilled from warehouses and delivered by external **agents** or internal **drivers**; **accounting** tracks agent remittances/settlements, expenses, payroll, and inventory valuation. All money is Nigerian Naira (₦).

- **Order lifecycle:** Order in → Confirm stock → Pick & Pack → Dispatch → Delivered. Actual `OrderStatus`: `PENDING | CONFIRMED | DELIVERED | CANCELLED | FAILED` (there is no CREATED/ASSIGNED/COMPLETED — `docs/architecture.md` is stale on this).
- **Order numbers:** per-product-prefix sequences via `OrderCounter` (e.g. `NEURO-001`), *not* `ORD-1001` (docs that say `ORD-XXXX` are stale).
- **Branding is inconsistent in the codebase** — *Nutricare*, *Nuycle*, and *Nucle* all appear (logos `nucle-logo.png` / `nuycle-logo.png`), and accounting treats **Nucle** and **Nutriticare** as two separate payroll companies (`SalaryRecord.company`). The installed PWA / app name is **"Nucle CRM"** (owner's current name). Don't blindly find-replace one name for another.
- Deeper domain reference (per-screen fields, the 21 business rules): `docs/business-context.md`.

## Architecture

### Layered Design

```
Pages/Components (app/)
  → Server Actions (modules/*/actions/*.action.ts)
  → Services (modules/*/services/*.service.ts)
  → Prisma (lib/db/prisma.ts)
```

- **Pages/Components** never import Prisma directly — always go through services.
- **Server actions** (`"use server"`) validate with Zod, check auth/role, call services, then `revalidatePath` and redirect or return state.
- **Services** are plain async functions (no classes) that encapsulate all Prisma queries.
- Always import the app client `prisma` from `lib/db/prisma.ts` — it is the base client **extended with the audit camera** (auto-logs writes). `basePrisma` is private to the audit layer.

### Module Structure

Each domain lives under `modules/{feature}/` with `actions/*.action.ts` and `services/*.service.ts` (some also have `lib/`, `data/`, `types.ts`).

| Module | What it covers |
|---|---|
| `auth` | login, admin-login, signup, logout; `auth.service` (Prisma lookup + bcrypt) |
| `orders` | orders, admin-orders, sales-manager-orders; services: orders, admin-dashboard, analytics, products, order-number, tier-pricing, upsell-apply, manual-order, deliver-order/undo-delivery, reassign-agent/-description, sales-report |
| `users` | users, admin-access, sales-manager-teams, team-analytics; `users.service` |
| `delivery` | agents, logistics-agents, logistics-dispatch, logistics-update-status, delivery-agent-portal, notifications; services for delivery, drivers, logistics dashboard/orders/dispatch/report/team, delivery-agent portal |
| `finance` | dashboard, expenses, invoices, ledger, salary, sales-record, settlements, fixed-assets, suppliers, inventory-accounting, agent-data; matching services + `data/chart-of-accounts.ts` + `lib/depreciation.ts` |
| `inventory` | stock, upload; services: inventory, stock-level, movement-format, raps (**no longer a stub**) |
| `warehouse` | incoming, outgoing, returns, location, pick-pack, receive-transfer; `warehouse.service` |
| `admin` | forms management (`forms.action`, `forms.service`) |
| `media-buyer` | `media-buyer.service` (lead/order-capture form performance) |
| `data-analysis` | data-analysis, media-buyer-analysis, stock-analysis services |
| `audit` | audit-log, audit-query, whatsapp-audit services; audit-export action |
| `chat` | chat.action; conversations, messages, tags services |
| `reports` | executive narrative report `definitions.ts`, `types.ts`, `period.service.ts` |

### Auth (Two-File Pattern)

Split for Edge compatibility:
- `lib/auth/auth.config.ts` — Edge-safe (no Prisma). Holds `ROLE_ROUTES` and `ADMIN_ROUTE_ROLES` (route-prefix → allowed-roles maps), the `authorized()` route guard, and JWT/session callbacks. **Prefix ordering matters** — longer prefixes must come first (`/admin/accounting` before `/admin/account`; `/sales-rep-manager` before `/sales-rep`; first match wins).
- `lib/auth/auth.ts` — Full server-side NextAuth: Credentials provider, Prisma lookup, bcryptjs (12 rounds).
- `lib/auth/role-routes.ts` — `ROLE_HOME` map + `getRoleHome()`, `isSuperAdmin()`, `isAdmin()`, `isCompanySalesManager()`.
- `proxy.ts` — Edge middleware (**Next.js 16 renamed `middleware.ts` → `proxy.ts`**): `NextAuth(authConfig).auth` with a matcher that excludes `_next`, static assets, and the PWA entry points (`sw.js`, `manifest.webmanifest`, `icons/`).
- Per-admin page revocation: `lib/auth/admin-pages.ts` holds the `ADMIN_PAGES` registry (page key → label → route prefixes; drives sidebar + guards + toggle UI via `canAccessAdminPage()`); `lib/auth/guard-admin-page.ts` `requireAdminPageAccess(pageKey)` re-checks `User.revokedAdminPages[]` fresh from the DB in each revocable section layout (`staff`, `orders`, `inventory`, `forms`, `history`, chat). Super-admin manages toggles at `/admin/staff/admins`. Privileged accounts are **not** self-registered (signup excludes admin roles) — provision via the seed scripts.
- Per-accountant feature grants: `lib/auth/accounting-permissions.ts` + `lib/auth/accounting-access.ts`, backed by `User.accountingPermissions[]`.

Session shape (`types/next-auth.d.ts`): `{ id, name, email, role: UserRole, warehouseId }`.

### Roles (11)

`SUPER_ADMIN | ADMIN | SALES_REP | SALES_REP_MANAGER | DELIVERY_AGENT | DATA_ANALYST | ACCOUNTANT | INVENTORY_MANAGER | WAREHOUSE_MANAGER | LOGISTICS_MANAGER | MEDIA_BUYER`

`SUPER_ADMIN` = full access + read-only oversight of every role dashboard. `ADMIN` = limited admin (all admin pages except SUPER_ADMIN-only Account oversight, minus any revoked pages).

### Route Groups (Role-Based Dashboards)

| Group folder | Route prefix | Role(s) |
|---|---|---|
| `(admin)` | `/admin` | ADMIN, SUPER_ADMIN |
| `(sales-rep)` | `/sales-rep` | SALES_REP |
| `(sales-rep-manager)` | `/sales-rep-manager` | SALES_REP team-leads (`isTeamLead` gate in layout) |
| `(sales-manager)` | `/sales-manager` | SALES_REP_MANAGER (company-wide); SUPER_ADMIN read-only |
| `(delivery-agent)` | `/delivery-agents` | DELIVERY_AGENT |
| `(accounting)` | `/accounting` | ACCOUNTANT |
| `(inventory)` | `/inventory` | INVENTORY_MANAGER |
| `(warehouse)` | `/warehouse` | WAREHOUSE_MANAGER |
| `(logistics)` | `/logistics` | LOGISTICS_MANAGER |
| `(data-analysis)` | `/data` | DATA_ANALYST |
| `(media-buyer)` | `/media-buyer` | MEDIA_BUYER |
| `chat` | `/chat` | any authenticated role |
| `(auth)` | `/login`, `/signup` | public |
| `(admin-auth)` | `/admin/login` | public |

Public order intake: `app/order-form/[id]/` + `POST /api/orders/form-submit` receive submissions from media-buyer form embeds. Root `app/page.tsx` redirects to the signed-in user's role home (or `/login`).

### Database

Prisma + Neon serverless adapter (WebSocket pool). `lib/db/prisma.ts` detects `neon.tech` in `DATABASE_URL` and switches to the Neon adapter (pool tuned: `idleTimeout 30s`, `connectTimeout 10s`, `max 10`), otherwise standard Postgres.

**~58 models, 28 enums.** All models use `cuid()` PKs, `createdAt`/`updatedAt`, most have `deletedAt` (soft deletes). Money is `Decimal(10,2)` (Nigerian Naira ₦). Tables map to `snake_case` via `@@map`.

> **Schema-drift gotcha:** the live DB has a drifted `StockMovement.supplierInvoiceUrls` column; `prisma db push` can report data-loss and refuse. Add new columns via targeted raw SQL — **never** `db push --accept-data-loss` (it would drop the drifted column).

**Audit camera (cross-cutting):** the exported `prisma` client is `basePrisma.$extends(createAuditCamera(...))` — it auto-writes a row to `audit_logs` for every create/update/delete of a top-level business entity. It is recursion-safe (writes via `basePrisma`, skips `AuditLog`), **out-of-band** (written post-response, never inside the caller's transaction), never throws into business logic, and log-on-success only. Derived/child/high-churn tables are in `IGNORED_MODELS` (`lib/audit/camera.ts`). Rich manual flows that write their own `logActivity` row suppress the auto-row via `withoutCameraAudit(fn)` / `suppressCameraForRequest()` (`lib/audit/context.ts`, AsyncLocalStorage-based). **Placement caveat:** `suppressCameraForRequest()` must be called **in the action body** before its writes — a call inside an awaited auth guard does not propagate to the writes and causes double-logging. `AuditLog` also stores a denormalized actor snapshot (`actorName`/`actorRole`) and structured `details` (`{ description, before?, after?, amount? }`); the review UI is `/admin/history` (Personal/General tabs, department/date filters, CSV/PDF export). Actions taken on behalf of a rep (agent/analyst marking an order delivered/failed) log under the rep's `userId` with the real actor in `actorName/actorRole`. See `docs/audit-hybrid.md` + `docs/audit-history-feature.md`.

#### Key Models & Enums (grouped)

- **Identity/org:** `User` (role, `teamId`, `isTeamLead`, `warehouseId`, `agentId`, `revokedAdminPages[]`, `accountingPermissions[]`, `accountActivationStatus`), `Team` (`Department`), `Customer`.
- **Catalog:** `Product`, `ProductCategory`, `ProductPackage`, `ProductOffer`, `ProductCombo`, `ProductGift`, `Supplier`, `OrderCounter` (per-prefix running order-number sequence, e.g. `NEURO-001`).
- **Sales:** `Order` (`OrderStatus`, `RemittanceStatus`, `ContactMethod`, upsell/discount fields, `formId`), `OrderItem` (`isUpsell`, `upsellAmount`, `upsellQuantity`, `costPriceAtSale`), `Form` + `FormView` (media-buyer capture forms; `data` JSON).
- **Inventory/warehouse:** `StockMovement` (`StockMovementType` INCOMING/OUTGOING/RETURN, `StockMovementStatus`, `RapsApprovalStatus`), `StockMovementItem`, `StockTransfer` (polymorphic `sourceType/targetType` = `StockTransferNodeType`), `StockAdjustment(+Item)`, `StockLevel`, `Warehouse`, `WarehouseLocation` (`OccupancyStatus`), `ShelfProductStock`, `GoodsReceiving` (`QCStatus`, `ShelvingStatus`), `PickPack`/`PickPacker`, `DamageReport`, `PurchaseOrder(+Item)`.
- **Delivery:** `Delivery` (`DeliveryStatus`), `Agent` (external distributor; `AgentStatus`, `statesCovered` JSON), `Driver` (internal truck driver — separate from Agent and User), `Vehicle` (`VehicleType`), `DeliveryZone`, `Route`.
- **Finance/accounting:** `Invoice` (`InvoiceStatus`, `InvoiceType`) + `InvoiceItem`, `Expense` (+`ExpenseLineItem`), `ExpenseCategory` + `ExpenseName` (chart of accounts), `PaymentAccount` (opening balance roll-forward), `JournalEntry` + `JournalEntryRow`, `FixedAsset` (depreciation), `SalaryRecord` (`company` = Nucle / Nutriticare), `AgentSettlement`, `AgentLedgerEntry` (`AgentLedgerRefType`), `SettlementAdjustment` (`AdjustmentType`), `RemittanceBank` (MONIEPOINT/ZENITH).
- **Platform:** `Notification` (`type` is a String), `AuditLog`, chat models `Conversation`/`ConversationMember`/`Message`/`MessageMention`/`MessageOrderRef` (`ConversationType`, `MessageType`; denormalized unread counts + last-message previews).

### Cross-Cutting Integrations

- **WhatsApp Cloud API** (`lib/whatsapp/whatsapp.ts`) — Meta Graph `v25.0` template messages (order confirmation, delivery). Normalizes phones to `234…`; `sanitizeTemplateParam()` strips newlines/tabs/long spaces to avoid Meta error `#132000`. Template changes must be **approved in Meta before deploy** or sends fail. Send failures are logged to `AuditLog` via `modules/audit/services/whatsapp-audit.service.ts` (billing arrears show code `131042`).
- **Realtime chat** (`lib/chat/socket.ts`, `lib/chat/tokens.ts`) — this app is the source of truth: it writes to the DB, then fire-and-forget publishes `message.created` to a **separate socket-server project** (`../nutricare-chat-socket/`) over a shared secret. Clients connect with a short-lived HMAC token minted at `GET /api/chat/socket-token`. No socket env → optimistic UI, no realtime.
- **Cloudinary** (`lib/cloudinary.ts`) — uploads via `app/api/upload/{avatar,chat,expense,supplier-invoice}`.
- **PDF export** (jsPDF) — `lib/pdf/invoice-pdf.ts`, `lib/reports/report-pdf.ts`, `lib/history-report-pdf.ts`, `lib/analytics-report.ts`.
- **Executive reports** (`modules/reports/*`, `components/reports/*`) — narrative daily/period report builder transcribed from managers' Word templates; `components/reports/report-view.tsx` + `period-switcher.tsx`.

### Pricing & Upsell (`docs/upsell-package-pricing.md`, `docs/upsell-display-rollout.md`)

- **Products are priced by per-form quantity packages, not `unitPrice × qty`.** A product's price tiers (qty 2 = ₦5,000, qty 4 = ₦8,000, …) live per-form in `Form.data.priceVariations`; `Order.formId` records which form an order came from. Public form intake (`app/api/orders/form-submit/route.ts`) stores `lineTotal = packagePrice`.
- **Manual order creation** (no public form) goes through `modules/orders/services/manual-order.service.ts` (`createManualOrder` + `logManualOrderCreated`), used by BOTH the rep's own `createOrderAction` and the data analyst's `createOrderByAnalystAction` — the money math must never be duplicated. The shared UI is `components/orders/add-order-modal.tsx`; pass `salesReps` to it to render the required rep picker. `createOrderAction` credits the caller and is gated to `SALES_REP`/`SUPER_ADMIN`; every other role must name the rep, because `Order.salesRepId` drives all rep analytics/commission. An analyst-keyed order is audited under the **rep's** `userId` with the analyst in `actorName`/`actorRole` (same on-behalf-of convention as mark-delivered).
- **Upsell (Add-Product on an existing order)** re-prices via `modules/orders/services/tier-pricing.service.ts` (`resolveUpsellPrice`) and the shared write service `upsell-apply.service.ts` (`applyUpsellItems`, used by BOTH the rep `addOrderItemsAction` and admin `adminAddOrderItemsAction` — the money math must never be duplicated). Same-product upsells **merge into one `OrderItem`**; surplus units beyond the nearest package use a rep-typed unit price (min > ₦0, audit-logged).
- **Upsell revenue = `SUM(OrderItem.upsellAmount)`; upsell units = `SUM(upsellQuantity)`** — report off these fields, not the legacy "multi-item order = upsell" heuristic still living in the analytics services (`analytics.service.ts`, `users.service.ts`, `data-analysis.service.ts`, `lib/performance.ts`).
- **`OrderItem.lineTotal` / `Order.netAmount` are authoritative** — every display reads stored values; nothing recomputes `sellingPrice × qty`. Fulfillment roles (logistics, delivery-agent) never see the upsell **amount**, only a `+N` badge (`lib/orders/upsell.ts` `upsellExtraCount`).

### API Routes (`app/api/`)

`auth/[...nextauth]` · `orders/form-submit` (public order intake) · `forms/[id]` + `forms/[id]/view` (fetch + view tracking) · `teams` · `warehouses` · `chat/socket-token` · `upload/{avatar,chat,expense,supplier-invoice}`.

### Utilities

`lib/utils.ts`: `cn()`, `formatCurrency()` (₦), `formatDate()` (en-NG), `getInitials()`. Also many period helpers (`lib/month-period.ts`, `lib/date-period.ts`, `lib/staff-period.ts`), `lib/bonus.ts`, `lib/orders/upsell.ts`, `lib/forms/embed-codes.ts`, `lib/staff-departments.ts`.

### UI Conventions

- **Light theme**: near-white (`#f8f9fa`) base, purple (`#8B2FE8`) primary/accent — see `:root` in `app/globals.css`. Font: Poppins. Toasts: `sonner` (mounted in `app/layout.tsx`).
- Component library: `@base-ui/react` primitives in `components/ui/`; charts via `recharts` (`components/dashboard/dashboard-charts.tsx`).
- **Per-role sidebars** are client components (e.g. `components/layout/inventory-sidebar-client.tsx`, `app/(role)/**/sidebar-client.tsx`) with active-link detection via `usePathname`.
- Some screens still render placeholder data from `lib/mock-data/*` — replace with real services when touching them.

### Naming Conventions

- Interactive client components: suffix `-client.tsx`. Server actions: `*.action.ts`. Services: `*.service.ts`. Zod schemas: `lib/validations/*.ts`. Tables: `snake_case` via `@@map`; IDs: `cuid()`.

### Coding Conventions

- **Never instantiate `new PrismaClient()`** outside `lib/db/prisma.ts`; always import the extended `prisma`.
- **Never leak secrets** — `select` explicitly; never return `User.password` or put it in the JWT/session.
- **Server actions**: validate input with Zod first; check auth/role; return typed state for `useActionState` (don't throw); `revalidatePath` + `redirect` after mutations.
- **TypeScript is strict** — no `any`; prefer explicit return types on services/actions; use Prisma-generated types (`UserRole`, `OrderStatus`, …).
- Components are UI-only (no Prisma, no business logic) — all DB access lives in services.

### Scale & Performance (`docs/scale-considerations.md`)

The company expects high order volume. Already scale-ready: Neon pooled Postgres, indexed FKs on hot paths, the layered architecture. **Migrate before high volume:**
- **Aggregate in the database, not in app memory.** Several analytics services still `findMany(...).reduce(...)` in JS (`modules/orders/services/analytics.service.ts`, `modules/users/services/users.service.ts`, `modules/data-analysis/services/data-analysis.service.ts`, `lib/performance.ts`). Build all new reporting query-based (`groupBy`/`count`/`aggregate`/raw SQL) from day one.
- **Paginate** any unbounded list (orders, customers, audit log). **Add indexes** for new filter/sort columns.

### Allowed Remote Images (`next.config.ts`)

`ui-avatars.com`, `avatar.iran.liara.run`, `images.unsplash.com`, `placehold.co`, `res.cloudinary.com`. Also sets PWA cache headers (`no-store` on `/sw.js`, `must-revalidate` on the manifest).

### PWA (installable, hand-built — no `next-pwa`/`serwist`)

- `app/manifest.ts` → served at `/manifest.webmanifest`. App name is **"Nucle CRM"**.
- `public/sw.js` — service worker. **Caches only content-hashed build assets (`/_next/static/*`), icons, and the offline page. Never caches HTML/RSC payloads/`/api`/authenticated data** (staff phones are shared → no business-data leak). Bump `CACHE_VERSION` to force clients to drop old caches. Navigations are network-first with `/offline` fallback; RSC requests excluded from the fallback.
- `components/pwa/service-worker-register.tsx` — registers `/sw.js` (**production only**), mounted in `app/layout.tsx`.
- `components/pwa/install-prompt.tsx` — Android `beforeinstallprompt` button + iOS "Share → Add to Home Screen" card (iOS has no programmatic install). Phone-only, hidden in standalone mode, 14-day snooze.
- `app/offline/page.tsx` + `offline-retry.tsx` — offline fallback. PWA `metadata`/`viewport` live in `app/layout.tsx`. Icons in `public/icons/`.

## Key Design Decisions

- **Audit camera** — one Prisma extension auto-logs all business writes, out-of-band; no per-action logging code. Suppress with `withoutCameraAudit` when a flow writes its own rich log.
- **Chat is externalized** — this app owns the data; a standalone socket server owns fan-out. Everything degrades gracefully without it.
- **Single `StockMovement` model** covers INCOMING/OUTGOING/RETURN with nullable type-specific fields.
- **Polymorphic transfers** — `StockTransfer` uses `sourceId/targetId` strings + node-type enums.
- **Agent stock commitment** — an agent's "booking" is derived, not stored: committed = Σ `OrderItem.quantity` on that agent's CONFIRMED orders (`getAgentCommittedQuantities`, `modules/delivery/services/agents.service.ts`). Assignment/confirm is **permissive** (the agent need only physically hold the goods — `checkAgentOnHandStock`), so an earlier booking can never block a newer, more urgent order; over-booking is legal and surfaced as a warning. The hard zero floor lives at **delivery**, in `modules/orders/services/deliver-order.service.ts` (`deliverOrder`, the single write path behind all four mark-delivered actions), which refuses rather than driving `StockLevel` negative. See `docs/agent-stock-commitment.md`.
- **Agent ≠ User ≠ Driver** — `Agent` (external distributor) and `Driver` (truck driver) are separate models; `User` is internal staff only.
- **`Notification.type` / many status-ish fields are Strings** to avoid migrations as types grow.
- **`statesCovered` on Agent** and form `data` are JSON — avoids junction tables for finite/flexible sets.
- **Upsell pricing** — `OrderItem.upsellAmount/upsellQuantity` are the source of truth for upsell-revenue reporting (see `docs/upsell-package-pricing.md`).
- **RAPS** (Returned-at-Point-of-Supply) — units rejected back to a supplier during incoming receipt; an audit sign-off only, never credited to stock.
- **Nucle vs Nutriticare** — the business runs two payroll companies (`SalaryRecord.company`, accounting salary filters). Do not blindly collapse the two names.

## Additional Docs (`docs/`) — trust map

**Reliable references / accurate feature specs** (trust, but verify against code before large changes):
- `architecture.md` — folder tree, layered request flow, coding conventions, how to add a module (rewritten to match the code; a deeper companion to this file).
- `business-context.md` — business domain, per-screen fields, 21 business rules. *(Roles list + `ORD-XXXX` numbers are stale; the rest holds.)*
- `schema-notes.md` — model/enum purposes + design rationale. *(Says "37 models / 8 roles" — an undercount; the rationale is still accurate.)*
- `audit-hybrid.md` + `audit-history-feature.md` — the audit camera + history UI.
- `super-admin-feature.md` — admin tiers + per-page access control.
- `upsell-package-pricing.md` — package pricing + upsell math. *(Header says "PLANNED" but it is **shipped**.)*
- `upsell-display-rollout.md` — where upsell cards/badges show per role.
- `agent-stock-commitment.md` — how orders lay claim to agent stock, the tiered agent selection, and the delivery-time zero floor.
- `scale-considerations.md` — what to make query-based before high volume.

*(The early one-off build prompts `schema-prompt.md`, `schema-updates.md`, `batch-2-auth-fixes.md`, and `inventory-forms-updates.md` were deleted — fully superseded by the code.)*
