# Nucle CRM — Architecture

> **`CLAUDE.md` is the authoritative quick-reference** (stack, modules, route groups, data model,
> integrations, conventions). This document is the **deeper narrative companion**: the folder tree,
> the request flow, and how to add a module. Where they overlap, CLAUDE.md wins — keep both in sync
> when the structure changes.

## Overview

Nucle CRM (the business is also referred to as *Nutricare* — see the branding note in `CLAUDE.md`)
is a role-based logistics, sales, inventory, and finance system. **Eleven staff roles** each get
their own dashboard under an App Router route group; **server actions** validate input and call
**services**, which own all Prisma access. Built on Next.js 16 (App Router) + React 19, TypeScript
(strict), Prisma + Neon serverless Postgres, NextAuth v5, and Tailwind v4. See `CLAUDE.md` → *Stack*
for exact versions and the full integration list (WhatsApp, Cloudinary, external chat socket, PDF).

## Folder structure (representative — not exhaustive)

```
/
├── app/                          # Next.js App Router — role-based route groups
│   ├── (auth)/                   # /login, /signup                — public
│   ├── (admin-auth)/             # /admin/login                   — public
│   ├── (admin)/                  # /admin                         — ADMIN, SUPER_ADMIN
│   ├── (sales-rep)/              # /sales-rep                     — SALES_REP
│   ├── (sales-rep-manager)/      # /sales-rep-manager             — SALES_REP team leads
│   ├── (sales-manager)/          # /sales-manager                 — SALES_REP_MANAGER (company-wide)
│   ├── (delivery-agent)/         # /delivery-agents               — DELIVERY_AGENT
│   ├── (accounting)/             # /accounting                    — ACCOUNTANT
│   ├── (inventory)/              # /inventory                     — INVENTORY_MANAGER
│   ├── (warehouse)/              # /warehouse                     — WAREHOUSE_MANAGER
│   ├── (logistics)/              # /logistics                     — LOGISTICS_MANAGER
│   ├── (data-analysis)/          # /data                          — DATA_ANALYST
│   ├── (media-buyer)/            # /media-buyer                   — MEDIA_BUYER
│   ├── chat/                     # /chat                          — any authenticated role
│   ├── order-form/[id]/          # public order-capture page (media-buyer form embeds) → POST /api/orders/form-submit
│   ├── offline/                  # PWA offline fallback page
│   ├── api/                      # route handlers (auth, orders/form-submit, uploads, chat token, forms, teams, warehouses)
│   ├── manifest.ts               # PWA web manifest → /manifest.webmanifest
│   ├── globals.css               # Tailwind v4 tokens (light / purple theme)
│   └── layout.tsx                # Root layout (fonts, metadata, PWA register + install prompt, toaster)
│
├── components/
│   ├── ui/                       # Base UI primitives (@base-ui/react)
│   ├── layout/                   # sidebars (per-role *-client.tsx), header, nav-config.ts
│   ├── dashboard/                # charts, inventory widgets, form builder
│   ├── reports/                  # executive report view + period switcher
│   ├── pwa/                      # service-worker-register, install-prompt
│   ├── admin/  stock/            # filters, stock balance explorer
│
├── modules/                      # feature domains — actions/ (server actions) + services/ (DB logic)
│   ├── auth/ orders/ users/ delivery/ finance/ inventory/ warehouse/
│   └── admin/ media-buyer/ data-analysis/ audit/ chat/ reports/
│
├── lib/
│   ├── auth/                     # auth.config.ts, auth.ts, role-routes.ts, admin-pages.ts,
│   │                             #   guard-admin-page.ts, accounting-permissions.ts / -access.ts
│   ├── db/prisma.ts              # Prisma client — Neon adapter + audit-camera extension
│   ├── audit/                    # camera.ts, actor.ts, context.ts, schedule.ts
│   ├── whatsapp/whatsapp.ts      # Meta WhatsApp Cloud API
│   ├── chat/                     # socket.ts, tokens.ts — bridge to external socket server
│   ├── cloudinary.ts             # media uploads
│   ├── pdf/ reports/             # PDF generation (jsPDF)
│   ├── orders/                   # upsell helpers (upsell.ts, use-upsell-preview.ts)
│   ├── validations/              # Zod schemas
│   ├── mock-data/                # placeholder data (being phased out)
│   └── utils.ts                  # cn(), formatCurrency() (₦), formatDate() (en-NG), getInitials()
│
├── prisma/
│   ├── schema.prisma             # ~58 models, 28 enums
│   └── seed*.ts, migrate-admins.ts, backfill-audit-actor.ts
│
├── scripts/                      # seed-admin.ts, seed-limited-admin.ts (env-driven admin bootstrap)
├── types/                        # next-auth.d.ts (session augmentation), jspdf.d.ts
├── public/                       # icons/, sw.js (service worker), logos
├── proxy.ts                      # Edge middleware — route protection (Next.js 16's renamed middleware)
├── next.config.ts                # images, PWA cache headers
└── docs/                         # deeper design notes (see the trust map in CLAUDE.md)
```

## Layered design

```
Pages/Components (app/)
  → Server Actions (modules/*/actions/*.action.ts)   # validate (Zod) → check auth/role → call service → revalidate/redirect
  → Services       (modules/*/services/*.service.ts) # all Prisma queries + business logic
  → Prisma         (lib/db/prisma.ts)                # base client + audit-camera extension
```

- **Components are UI-only** — no Prisma, no business logic.
- **Services own all DB access** — pages/components never import Prisma directly.
- The exported `prisma` client auto-logs every business write to `audit_logs` (the audit camera).
  Import it everywhere; `basePrisma` is private to the audit layer. See `CLAUDE.md` → *Audit camera*.

## Roles & route groups

Eleven roles, each mapped to a route group and guarded in `lib/auth/auth.config.ts` (coarse, Edge)
plus section layouts (fine-grained, e.g. admin per-page revocation). The full role → prefix → access
table lives in `CLAUDE.md` → *Roles* and *Route Groups*; the two-file auth pattern is in
`CLAUDE.md` → *Auth*. `SUPER_ADMIN` has read-only oversight of every dashboard.

## Order lifecycle

```
Order in → Confirm stock → Pick & Pack → Dispatch → Delivered
```

`OrderStatus` enum: `PENDING | CONFIRMED | DELIVERED | CANCELLED | FAILED`. Order numbers are
per-product-prefix sequences via `OrderCounter` (e.g. `NEURO-001`). Pricing is per-form quantity
**packages**, not `unitPrice × qty` — see `CLAUDE.md` → *Pricing & Upsell*.

## Coding conventions

1. **Separation of concerns** — components (UI) → actions (validate/auth/orchestrate) → services (DB).
2. **Server actions** — validate with Zod first; check auth/role; return typed state for
   `useActionState` (don't throw); `revalidatePath` + `redirect` after mutations.
3. **Database** — never instantiate `new PrismaClient()` outside `lib/db/prisma.ts`; import the
   extended `prisma`. Use `select` to avoid leaking sensitive fields (never return `User.password`
   or put it in the JWT/session).
4. **TypeScript** — `strict: true`, no `any`; explicit return types on services/actions; use
   Prisma-generated types (`UserRole`, `OrderStatus`, …).
5. **Auth** — `lib/auth/auth.config.ts` is Edge-safe (importable in `proxy.ts`); `lib/auth/auth.ts`
   is the full Node config. Session carries `{ id, name, email, role, warehouseId }`.
6. **File naming** — pages/layouts `page.tsx`/`layout.tsx`; interactive client components
   `*-client.tsx`; services `*.service.ts`; actions `*.action.ts`; Zod schemas in `lib/validations/`.

## Adding a new module

1. Create `modules/<name>/services/<name>.service.ts` — the Prisma/business logic.
2. Create `modules/<name>/actions/<name>.action.ts` — server actions (Zod validate → auth check →
   call service → `revalidatePath`/`redirect`).
3. Add the Prisma model(s) to `prisma/schema.prisma`, then `npx prisma db push` + `npx prisma generate`.
   ⚠️ If `db push` reports data-loss because of the drifted `supplierInvoiceUrls` column, add the new
   columns via targeted raw SQL instead — **never** `--accept-data-loss`.
4. Add pages under the owning role's route group (`app/(<group>)/…`), plus a `layout.tsx` if the
   section needs its own guard.
5. Wire navigation: the admin nav is `components/layout/nav-config.ts` (`allNavItems`); other roles
   have their own `*-sidebar-client.tsx`.
6. If it introduces a new role, add it to the `UserRole` enum, `ROLE_HOME` (`lib/auth/role-routes.ts`),
   and the route maps in `lib/auth/auth.config.ts`.

## Environment & deeper references

Environment variables (database, WhatsApp, Cloudinary, chat socket, audit, admin bootstrap) are
documented in `CLAUDE.md` → *Environment Variables*. For domain detail and design rationale, see the
`docs/` trust map in `CLAUDE.md`.
