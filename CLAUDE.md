# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run lint      # Run ESLint
npx prisma studio # Open Prisma DB browser
npx prisma db push        # Push schema changes to DB
npx prisma generate       # Regenerate Prisma client after schema changes
```

No test runner is configured yet.

## Environment Variables

Required in `.env`:
- `DATABASE_URL` — Neon pooled connection string
- `DIRECT_URL` — Neon direct connection string (used by Prisma migrations)
- `AUTH_SECRET` — NextAuth secret

## Architecture

**Stack:** Next.js App Router, NextAuth v5 (beta), Prisma + Neon (serverless PostgreSQL), Tailwind CSS v4, Zod v4.

### Layered Design

```
UI (app/ components/) → Server Actions (modules/*/actions/) → Services (modules/*/services/) → Prisma (lib/db/prisma.ts)
```

- **Components/Pages** never import Prisma directly — always go through services.
- **Server actions** (`"use server"`) handle form submissions; they validate with Zod then call services.
- **Services** are plain async functions (not classes) that encapsulate all DB queries.

### Module Structure

Each domain lives under `modules/{feature}/`:
- `actions/*.action.ts` — server actions (form state, redirects)
- `services/*.service.ts` — pure DB query functions

Modules: `auth`, `orders`, `users`, `delivery`, `finance`, `inventory` (stub).

### Auth (Two-File Pattern)

Auth is split for Edge compatibility:
- `lib/auth/auth.config.ts` — Edge-safe config (no Prisma); handles route protection and redirects
- `lib/auth/auth.ts` — Full server-side NextAuth setup with Prisma and bcryptjs
- `middleware.ts` — Runs on Edge; delegates to `authConfig.authorized()`

Session includes `user.id` and `user.role` (see `types/next-auth.d.ts`).

### Database

Prisma with Neon serverless adapter (WebSocket). Key models:
- **User** — roles: `ADMIN | SALES_REP | DELIVERY_AGENT | ACCOUNTANT | WAREHOUSE`
- **Order** — status: `CREATED → CONFIRMED → ASSIGNED → DELIVERED → COMPLETED`
- **DeliveryAgent** — extends User (one-to-one FK)
- **Transaction** — type: `CREDIT | DEBIT | REFUND`; status: `PENDING | COMPLETED | FAILED | CANCELLED`

All monetary fields use `Decimal(10, 2)`. All models use CUID PKs and `createdAt`/`updatedAt`.

### Utilities

`lib/utils/index.ts` exports:
- `cn()` — clsx + tailwind-merge for conditional classNames
- `formatCurrency()` — NGN formatting
- `formatDate()`, `getInitials()`

### UI Conventions

Dark theme (slate-950 base, emerald accents). Icons via `lucide-react`. Sidebar is a client component (active link detection); Header is a server component (fetches session).
