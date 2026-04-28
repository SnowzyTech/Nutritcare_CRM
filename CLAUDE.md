# CLAUDE.md

@AGENTS.md

## Commands

```bash
npm run dev              # Start development server
npm run build            # Production build
npm run lint             # Run ESLint
npm run db:seed          # Seed the database (tsx prisma/seed.ts)
npx prisma studio        # Open Prisma DB browser
npx prisma db push       # Push schema changes to DB
npx prisma generate      # Regenerate Prisma client after schema changes
```

No test runner is configured yet.

## Environment Variables

Required in `.env`:
- `DATABASE_URL` — Neon pooled connection string
- `DIRECT_URL` — Neon direct connection string (used by Prisma migrations)
- `AUTH_SECRET` — NextAuth secret

## Stack

Next.js 16.2.4, React 19.2.4, TypeScript 5 (strict), NextAuth v5 (beta.31), Prisma 5.22 + Neon serverless PostgreSQL, Tailwind CSS v4, Zod v4, Recharts 3, Base UI (`@base-ui/react`), lucide-react, date-fns 4, bcryptjs.

## Architecture

### Layered Design

```
Pages/Components (app/)
  → Server Actions (modules/*/actions/*.action.ts)
  → Services (modules/*/services/*.service.ts)
  → Prisma (lib/db/prisma.ts)
```

- **Pages/Components** never import Prisma directly — always go through services.
- **Server actions** (`"use server"`) validate with Zod, check auth, call services, then `revalidatePath` and redirect or return state.
- **Services** are plain async functions (no classes) that encapsulate all Prisma queries.

### Module Structure

Each domain lives under `modules/{feature}/`:
- `actions/*.action.ts` — server actions (validation, auth check, service call, revalidate/redirect)
- `services/*.service.ts` — pure async DB query functions

Active modules: `auth`, `orders`, `users`, `delivery`, `finance`, `inventory`, `products`.

| Module | Actions | Services |
|---|---|---|
| auth | login, admin-login, signup | auth |
| orders | orders, admin-orders | orders, admin-dashboard, analytics, products |
| delivery | agents, delivery-agent-portal, logistics-agents | agents, create-delivery-agent, create-driver, delivery, delivery-agent-portal, logistics-orders |
| users | users | users |
| finance | — | finance |
| inventory | — | inventory (stub) |

### Auth (Two-File Pattern)

Split for Edge compatibility:
- `lib/auth/auth.config.ts` — Edge-safe config (no Prisma); route protection, role-based redirects, JWT/session callbacks
- `lib/auth/auth.ts` — Full server-side NextAuth with Credentials provider, Prisma lookup, bcryptjs (12 rounds)
- `lib/auth/role-routes.ts` — `ROLE_HOME` map and `getRoleHome()` utility
- `middleware.ts` — Runs on Edge; delegates to `authConfig.authorized()`

Session shape (`types/next-auth.d.ts`): `{ id, name, email, role: UserRole }`.

### Route Groups (Role-Based Dashboards)

| Group | Route prefix | Role |
|---|---|---|
| `(admin)` | `/admin` | ADMIN |
| `(sales-rep)` | `/sales-rep` | SALES_REP |
| `(sales-rep-manager)` | `/sales-rep-manager` | SALES_REP_MANAGER |
| `(delivery-agents)` | `/delivery-agents` | DELIVERY_AGENT |
| `(accounting)` | `/accounting` | ACCOUNTANT |
| `(inventory)` | `/inventory` | INVENTORY_MANAGER |
| `(warehouse)` | `/warehouse` | WAREHOUSE_MANAGER |
| `(logistics)` | `/logistics` | LOGISTICS_MANAGER |
| `(data-analysis)` | `/data` | DATA_ANALYST |
| `(auth)` | `/login`, `/signup` | public |
| `(admin-auth)` | `/admin/login` | public |

### Database

Prisma with Neon serverless adapter (WebSocket pooled connections). The client in `lib/db/prisma.ts` detects `neon.tech` in `DATABASE_URL` and switches to the Neon adapter automatically; otherwise falls back to standard Postgres.

All models use `cuid()` PKs, `createdAt`/`updatedAt`, and most have `deletedAt` for soft deletes. Monetary fields are `Decimal(10,2)` (Nigerian Naira). Tables are mapped to `snake_case` via `@@map`.

#### Key Models & Enums

**User**
- `role`: `ADMIN | SALES_REP | SALES_REP_MANAGER | DELIVERY_AGENT | ACCOUNTANT | INVENTORY_MANAGER | WAREHOUSE_MANAGER | LOGISTICS_MANAGER | DATA_ANALYST`

**Order**
- `status`: `PENDING | CONFIRMED | DELIVERED | CANCELLED | FAILED`
- Relations: `Customer`, `User` (salesRep), `Agent`, `OrderItem[]`

**Delivery**
- `status`: `PENDING_DISPATCH | IN_TRANSIT | DELIVERED | FAILED`

**StockMovement**
- `type`: `INCOMING | OUTGOING | RETURN`
- `status`: `DRAFT | RECORDED | RECEIVED | NOT_RECEIVED | QC_CHECK | SHELVED`

**Invoice**
- `status`: `DRAFT | SENT | PAID | OVERDUE | CANCELLED`
- `type`: `INVOICE | SALES_RECEIPT | REFUND_RECEIPT`

**PickPack**
- `status`: `QUEUED | PACKING | PACKED | DISPATCHED`

**Agent** — External delivery/distribution agents (NOT a `User`; entirely separate model with its own `AgentStatus`, ledger, and settlement models).

Other models: `Product`, `ProductCategory`, `ProductOffer`, `ProductCombo`, `ProductGift`, `Supplier`, `Warehouse`, `WarehouseLocation`, `StockTransfer`, `PurchaseOrder`, `GoodsReceiving`, `Vehicle`, `DeliveryZone`, `Route`, `DamageReport`, `AgentSettlement`, `AgentLedgerEntry`, `SettlementAdjustment`, `Expense`, `ExpenseCategory`, `PaymentAccount`, `Notification`, `AuditLog`, `Team`, `Customer`.

### Utilities

`lib/utils.ts` exports:
- `cn()` — clsx + tailwind-merge for conditional classNames
- `formatCurrency()` — Nigerian Naira (₦) formatting
- `formatDate()` — en-NG locale date formatting
- `getInitials()` — name to initials

### UI Conventions

- Dark theme: slate-950 base, emerald accents
- Component style: `base-nova` (ShadCN variant) with CSS variables and neutral base color
- Component library: `@base-ui/react` primitives in `components/ui/`
- Icons: `lucide-react`
- Charts: `recharts` — `DashboardLineChart`, `DashboardBarChart` in `components/dashboard/dashboard-charts.tsx`
- Sidebar: client component (`sidebar-client.tsx`) — active link detection via `usePathname`
- Header: server component — fetches session server-side
- Navigation config: `components/layout/nav-config.ts` — `allNavItems` array

### Naming Conventions

- Client components that need interactivity: suffix `-client.tsx` (e.g., `orders-client.tsx`, `sidebar-client.tsx`)
- Server actions: `*.action.ts`
- Services: `*.service.ts`
- Zod schemas: `lib/validations/*.ts`
- Tables: `snake_case` via `@@map`; IDs: `cuid()`

### Allowed Remote Images (next.config.ts)

`ui-avatars.com`, `avatar.iran.liara.run`, `images.unsplash.com`, `placehold.co`

## Key Design Decisions

- **Single `StockMovement` model** covers INCOMING/OUTGOING/RETURN with nullable type-specific fields — avoids a separate model per movement type.
- **Agent ≠ User** — `Agent` is an external entity; `User` is internal staff only.
- **Polymorphic transfers** — `StockTransfer` uses `sourceId`/`targetId` strings + node-type enums (Prisma idiom for polymorphism).
- **`Notification.type` is a String** — avoids DB migrations as notification types grow.
- **`statesCovered` on Agent** — stored as JSON array to avoid a junction table for a finite, rarely-changing set.

## Additional Docs

- `docs/architecture.md` — Folder structure, coding conventions, new module creation steps
- `docs/business-context.md` — Full business domain: roles, order lifecycle, screen mockups, 21 business rules
- `docs/schema-notes.md` — All 37 models and 18 enums explained with design rationale
