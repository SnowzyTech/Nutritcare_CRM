# Nutricare CRM — Architecture Documentation

## Overview

Nutricare CRM is a production-grade logistics, finance, and inventory management system built with Next.js 15 App Router, TypeScript, Prisma, Auth.js, ShadCN UI, and TailwindCSS v4.

---

## Folder Structure

```
/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route group — no sidebar/header
│   │   ├── layout.tsx            # Centered dark layout for auth pages
│   │   └── login/
│   │       └── page.tsx          # Login page
│   ├── (dashboard)/              # Route group — sidebar + header
│   │   ├── layout.tsx            # Dashboard shell layout
│   │   └── page.tsx              # Dashboard home (/dashboard)
│   ├── api/
│   │   └── auth/[...nextauth]/
│   │       └── route.ts          # Auth.js catch-all handler
│   ├── globals.css               # Global Tailwind v4 styles + tokens
│   └── layout.tsx                # Root HTML layout with fonts/metadata
│
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx           # Dashboard sidebar navigation
│   │   └── header.tsx            # Dashboard top bar (session-aware)
│   └── ui/                       # ShadCN auto-generated components
│
├── lib/
│   ├── auth/
│   │   ├── auth.config.ts        # Edge-safe Auth.js config (for middleware)
│   │   └── auth.ts               # Full Auth.js setup (Credentials provider)
│   ├── db/
│   │   └── prisma.ts             # Prisma client singleton (Neon adapter)
│   ├── utils/
│   │   └── index.ts              # cn(), formatCurrency(), formatDate()...
│   └── validations/
│       └── auth.ts               # Zod schemas for login/register forms
│
├── middleware.ts                  # Route protection (Edge runtime)
│
├── modules/                      # Feature modules (business logic)
│   ├── auth/
│   │   ├── actions/
│   │   │   └── login.action.ts   # loginAction(), logoutAction() server actions
│   │   └── services/
│   │       └── auth.service.ts   # getUserByEmail(), createUser(), verifyPassword()
│   ├── orders/
│   │   └── services/
│   │       └── orders.service.ts # getAllOrders(), createOrder(), updateOrderStatus()
│   ├── delivery/
│   │   └── services/
│   │       └── delivery.service.ts
│   ├── finance/
│   │   └── services/
│   │       └── finance.service.ts
│   ├── inventory/
│   │   └── services/
│   │       └── inventory.service.ts
│   └── users/
│       └── services/
│           └── users.service.ts
│
├── prisma/
│   └── schema.prisma             # Database schema
│
├── types/
│   └── next-auth.d.ts            # TypeScript augmentations for Auth.js session
│
└── docs/
    └── architecture.md           # This file
```

---

## Role System

| Role             | Access Level                                        |
|------------------|-----------------------------------------------------|
| `ADMIN`          | Full access — all modules, users, settings          |
| `SALES_REP`      | Orders module — create, view, confirm orders        |
| `DELIVERY_AGENT` | Delivery module — view assigned deliveries          |
| `ACCOUNTANT`     | Finance module — view/create transactions           |
| `WAREHOUSE`      | Inventory module — manage stock levels              |

Route-level protection is enforced in `middleware.ts` via Auth.js `authorized()` callback.

---

## Order Lifecycle

```
CREATED → CONFIRMED → ASSIGNED → DELIVERED → COMPLETED
```

| Status      | Triggered By   | Description                            |
|-------------|----------------|----------------------------------------|
| `CREATED`   | System         | Order is placed by sales rep           |
| `CONFIRMED` | Admin          | Order details verified and approved    |
| `ASSIGNED`  | Admin          | Delivery agent assigned to order       |
| `DELIVERED` | Delivery Agent | Agent marks order as delivered         |
| `COMPLETED` | System/Admin   | Order fully processed, payment settled |

---

## Coding Conventions

### 1. Separation of Concerns
- **Components** — UI only. No direct DB calls, no business logic.
- **Services** (`/modules/*/services/`) — All DB access and business logic lives here.
- **Actions** (`/modules/*/actions/`) — Server actions that call services and handle errors/redirects.

### 2. Server Actions
- Always validate with Zod before touching the DB.
- Return typed state objects for `useActionState` (never throw from actions).
- Use `redirect()` after successful mutations.

### 3. Database Access
- All DB queries go through the Prisma singleton at `/lib/db/prisma.ts`.
- Never instantiate `new PrismaClient()` outside this file.
- Use `select` to avoid leaking sensitive fields (e.g. `password`).

### 4. TypeScript
- `strict: true` — no `any`.
- Prefer explicit return types on services and actions.
- Use Prisma-generated types (`UserRole`, `OrderStatus`, etc.) via `@prisma/client`.

### 5. Auth
- `lib/auth/auth.config.ts` — Edge-safe, importable in middleware.
- `lib/auth/auth.ts` — Full config with Prisma, importable only in Node.js runtime.
- Session carries: `id`, `name`, `email`, `role`. Never put passwords in JWT.

### 6. File Naming
- Pages/layouts: `page.tsx`, `layout.tsx` (Next.js convention).
- Services: `*.service.ts`
- Actions: `*.action.ts`
- Schemas: in `/lib/validations/`
- Components: PascalCase exported functions.

---

## Environment Variables

| Variable        | Purpose                                         |
|-----------------|-------------------------------------------------|
| `DATABASE_URL`  | Neon pooled connection string (app runtime)     |
| `DIRECT_URL`    | Neon direct connection string (Prisma CLI only) |
| `AUTH_SECRET`   | JWT signing secret (generate with openssl)      |
| `NEXTAUTH_URL`  | Base URL of the application                     |

---

## Adding a New Module

1. Create `/modules/<name>/services/<name>.service.ts` — DB logic.
2. Create `/modules/<name>/actions/<name>.action.ts` — server actions.
3. Add Prisma model to `prisma/schema.prisma` + run `npx prisma migrate dev`.
4. Add route under `app/(dashboard)/<name>/page.tsx`.
5. Add nav item to `components/layout/sidebar.tsx`.
