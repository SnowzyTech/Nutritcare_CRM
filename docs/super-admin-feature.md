# Super Admin + Limited Admin with per-admin page-access control

## Summary

The single all-powerful `ADMIN` role was split into two tiers:

- **Super Admin (`SUPER_ADMIN`)** — everything the old admin could do, including the
  Account oversight page, plus the power to grant/revoke individual page access for each
  limited admin. Existing admin accounts were migrated to `SUPER_ADMIN`.
- **Admin (`ADMIN`, limited)** — Dashboard, Staff Management, Order, Chat, History, Forms,
  Inventory. No Account page. Gets all these by default, but a Super Admin can revoke any of
  them per-admin, after which that admin can no longer see or open the page.

Both tiers share `/admin/login` and land on `/admin`.

## How access control works

- `lib/auth/role-routes.ts` — `isAdmin()` (either tier), `isSuperAdmin()`, `ROLE_HOME`.
- `lib/auth/admin-pages.ts` — the **page registry** (`ADMIN_PAGES`): single source of truth
  mapping page key → label → nav label → route prefixes. Drives the sidebar, the route
  guards, and the Super Admin toggle UI. `canAccessAdminPage()` decides visibility.
- `lib/auth/auth.config.ts` (middleware, Edge) — coarse role gate: both tiers may enter
  `/admin/*`; `/admin/account` is `SUPER_ADMIN` only; specialist dashboards fall back to
  `SUPER_ADMIN`.
- `lib/auth/guard-admin-page.ts` — `requireAdminPageAccess(pageKey)`: reads the admin's
  `revokedAdminPages` fresh from the DB, redirects to `/admin` if revoked. Called from each
  revocable section's `layout.tsx` (`staff`, `orders`, `inventory`, `forms`, `history`) and
  the chat layout. Fresh-on-render, so revocations take effect on the next navigation.
- Persistence: `User.revokedAdminPages String[]` (default `[]`). Empty = full access.

## Super Admin management UI

`/admin/staff/admins` (SUPER_ADMIN only) lists limited admins with a per-page toggle.
Changes go through `updateAdminPageAccessAction` (guarded by `isSuperAdmin`, validated with
Zod against the registry), persist via `setAdminPageAccess`, and write an `AuditLog` entry.

## Provisioning

Privileged accounts are NOT self-registered (signup excludes admin roles). Use env-driven
scripts:

- `npm run db:seed:superadmin` — reads `SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD`.
- `npm run db:seed:admin` — reads `ADMIN_EMAIL` / `ADMIN_PASSWORD` (opt. `ADMIN_NAME`).
- `npm run db:migrate-admins` — one-off: promote any remaining `ADMIN` to `SUPER_ADMIN`.

Long-term intended path (later): in-app Super-Admin "Create Admin" with temp password +
forced first-login reset + audit log. The scripts are the interim mechanism.

## Files of interest

- `prisma/schema.prisma` — `SUPER_ADMIN` enum value; `User.revokedAdminPages`
- `lib/auth/role-routes.ts`, `lib/auth/admin-pages.ts`, `lib/auth/guard-admin-page.ts`,
  `lib/auth/auth.config.ts`
- `app/(admin)/admin/{staff,orders,inventory,forms,history}/layout.tsx`, chat layout,
  `app/(admin)/admin/account/page.tsx`
- `app/(admin)/admin/staff/admins/{page.tsx,admins-client.tsx}`
- `components/layout/{sidebar.tsx,client-sidebar.tsx,nav-config.ts}`
- `modules/users/services/users.service.ts`, `modules/users/actions/admin-access.action.ts`
- Shared guards in users/orders/delivery/admin(forms) actions; `admin-login.action.ts`
- `scripts/seed-admin.ts`, `scripts/seed-limited-admin.ts`, `prisma/migrate-admins.ts`
