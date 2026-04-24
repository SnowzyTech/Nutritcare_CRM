# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

Next.js 16.2.4, React 19.2.4, TypeScript 5, NextAuth v5 (beta.31), Prisma 5.22 + Neon serverless PostgreSQL, Tailwind CSS v4, Zod v4, Recharts 3, Base UI (`@base-ui/react`), lucide-react.

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

Active modules: `auth`, `orders`, `users`, `delivery`, `finance`, `inventory` (stub).
New files: `modules/orders/services/products.service.ts`, `modules/orders/actions/orders.action.ts`.

### Auth (Two-File Pattern)

Split for Edge compatibility:
- `lib/auth/auth.config.ts` — Edge-safe config (no Prisma); route protection, role-based redirects, JWT/session callbacks
- `lib/auth/auth.ts` — Full server-side NextAuth with Credentials provider, Prisma lookup, bcryptjs
- `lib/auth/role-routes.ts` — `ROLE_HOME` map and `getRoleHome()` utility
- `middleware.ts` — Runs on Edge; delegates to `authConfig.authorized()`

Session shape (`types/next-auth.d.ts`): `{ id, name, email, role: UserRole }`.

### Route Groups (Role-Based Dashboards)

Each role gets its own route group and layout:

| Group | Route prefix | Role |
|---|---|---|
| `(admin)` | `/admin` | ADMIN |
| `(sales-rep)` | `/sales-rep` | SALES_REP |
| `(delivery-agents)` | `/delivery-agents` | DELIVERY_AGENT |
| `(accounting)` | `/accounting` | ACCOUNTANT |
| `(inventory)` | `/inventory` | INVENTORY_MANAGER |
| `(warehouse)` | `/warehouse` | WAREHOUSE_MANAGER |
| `(logistics)` | `/logistics` | LOGISTICS_MANAGER |
| `(data-analysis)` | `/data` | DATA_ANALYST |
| `(auth)` | `/login`, `/signup` | public |
| `(admin-auth)` | `/admin/login` | public |

### Database

Prisma with Neon serverless adapter (WebSocket pooled connections). Key models and their actual enum values:

**User**
- `role`: `ADMIN | SALES_REP | DELIVERY_AGENT | ACCOUNTANT | INVENTORY_MANAGER | WAREHOUSE_MANAGER | LOGISTICS_MANAGER | DATA_ANALYST`

**Order**
- `status`: `PENDING | CONFIRMED | DELIVERED | CANCELLED | FAILED`
- Links to `Customer`, `User` (salesRep), `Agent`, and `OrderItem[]`

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

All monetary fields use `Decimal(10,2)`. All models use CUID PKs and `createdAt`/`updatedAt`.

### Utilities

`lib/utils.ts` exports:
- `cn()` — clsx + tailwind-merge for conditional classNames
- `formatCurrency()` — Nigerian Naira (₦) formatting
- `formatDate()` — en-NG locale date formatting
- `getInitials()` — name to initials

### UI Conventions

- Dark theme: slate-950 base, emerald accents
- Component library: `@base-ui/react` primitives in `components/ui/`
- Icons: `lucide-react`
- Charts: `recharts` (DashboardLineChart, DashboardBarChart in `components/dashboard/dashboard-charts.tsx`)
- Sidebar: client component (`-client.tsx` naming convention for any interactive component) — active link detection via `usePathname`
- Header: server component — fetches session server-side
- Navigation config: `components/layout/nav-config.ts` — `allNavItems` array

### Naming Conventions

- Client components that need interactivity: suffix `-client.tsx` (e.g., `orders-client.tsx`, `order-detail-client.tsx`, `sidebar-client.tsx`)
- Server actions: `*.action.ts`
- Services: `*.service.ts`
- Zod schemas: `lib/validations/*.ts`

### Allowed Remote Images (next.config.ts)

`ui-avatars.com`, `avatar.iran.liara.run`, `images.unsplash.com`
