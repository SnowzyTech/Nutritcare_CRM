import type { NextAuthConfig } from "next-auth";
import { getRoleHome, isAdmin } from "@/lib/auth/role-routes";

const PUBLIC_AUTH_PAGES = ["/login", "/signup", "/admin/login"];

// Which roles may access each admin sub-route prefix. Both admin tiers share
// every admin capability EXCEPT the Account oversight page (SUPER_ADMIN only).
// Note: fine-grained per-admin page revocation is enforced fresh in the section
// layouts (guard-admin-page.ts), not here.
const ADMIN_ROUTE_ROLES: { prefix: string; roles: string[] }[] = [
  // `/admin/accounting` must precede `/admin/account` — the latter is a string
  // prefix of the former, and the first match wins.
  { prefix: "/admin/accounting", roles: ["ADMIN", "SUPER_ADMIN"] },
  { prefix: "/admin/account", roles: ["SUPER_ADMIN"] },
  { prefix: "/admin/orders", roles: ["ADMIN", "SUPER_ADMIN"] },
  { prefix: "/admin/delivery", roles: ["ADMIN", "SUPER_ADMIN"] },
  { prefix: "/admin/inventory", roles: ["ADMIN", "SUPER_ADMIN"] },
  { prefix: "/admin/users", roles: ["ADMIN", "SUPER_ADMIN"] },
  { prefix: "/admin/staff", roles: ["ADMIN", "SUPER_ADMIN"] },
  { prefix: "/admin/analytics", roles: ["ADMIN", "SUPER_ADMIN"] },
];

// Role-specific dashboard routes (non-admin). The cross-department oversight
// fallback belongs to SUPER_ADMIN (limited admins use /admin/*, not these).
const ROLE_ROUTES: { prefix: string; roles: string[] }[] = [
  // `/sales-rep-manager` must precede `/sales-rep` — the latter is a string
  // prefix of the former, and the first match wins. Team-leads (SALES_REP +
  // isTeamLead) and the company-wide manager (SALES_REP_MANAGER) share this
  // dashboard; the layout enforces the finer-grained team-lead/manager gate.
  { prefix: "/sales-rep-manager", roles: ["SUPER_ADMIN", "SALES_REP", "SALES_REP_MANAGER"] },
  { prefix: "/sales-rep", roles: ["SUPER_ADMIN", "SALES_REP"] },
  { prefix: "/delivery-agents", roles: ["SUPER_ADMIN", "DELIVERY_AGENT"] },
  { prefix: "/data", roles: ["SUPER_ADMIN", "DATA_ANALYST"] },
  { prefix: "/accounting", roles: ["SUPER_ADMIN", "ACCOUNTANT"] },
  { prefix: "/inventory", roles: ["SUPER_ADMIN", "INVENTORY_MANAGER"] },
  { prefix: "/warehouse", roles: ["SUPER_ADMIN", "WAREHOUSE_MANAGER"] },
  { prefix: "/logistics", roles: ["SUPER_ADMIN", "LOGISTICS_MANAGER"] },
  { prefix: "/media-buyer", roles: ["SUPER_ADMIN", "MEDIA_BUYER"] },
];

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;
      const role = auth?.user?.role as string | undefined;

      // Legacy redirect
      if (path === "/dashboard") {
        return Response.redirect(new URL(getRoleHome(role), nextUrl));
      }

      const isAuthPage = PUBLIC_AUTH_PAGES.includes(path);
      const isAdminRoute = path.startsWith("/admin") && path !== "/admin/login";
      const matchedRoleRoute = ROLE_ROUTES.find((r) => path.startsWith(r.prefix));

      // Send authenticated users away from auth pages to their dashboard
      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL(getRoleHome(role), nextUrl));
      }

      // Shared chat — any authenticated role, no role restriction.
      if (path.startsWith("/chat")) {
        return isLoggedIn;
      }

      // Protect role-specific routes
      if (matchedRoleRoute) {
        if (!isLoggedIn) return false;
        if (role && !matchedRoleRoute.roles.includes(role)) {
          return Response.redirect(new URL(getRoleHome(role), nextUrl));
        }
        return true;
      }

      // Protect admin routes
      if (isAdminRoute) {
        if (!isLoggedIn) return false;

        const matchedAdminRoute = ADMIN_ROUTE_ROLES.find((r) => path.startsWith(r.prefix));
        if (matchedAdminRoute) {
          // Sub-route has explicit role requirements
          if (role && !matchedAdminRoute.roles.includes(role)) {
            return Response.redirect(new URL(getRoleHome(role), nextUrl));
          }
        } else {
          // No explicit entry → either admin tier
          if (!isAdmin(role)) {
            return Response.redirect(new URL(getRoleHome(role), nextUrl));
          }
        }
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.warehouseId = (user as { warehouseId?: string | null }).warehouseId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.warehouseId = (token.warehouseId as string | null) ?? null;
      }
      return session;
    },
  },
  providers: [],
};
