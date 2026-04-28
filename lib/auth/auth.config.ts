import type { NextAuthConfig } from "next-auth";
import { getRoleHome } from "@/lib/auth/role-routes";

const PUBLIC_AUTH_PAGES = ["/login", "/signup", "/admin/login"];

// Which roles may access each admin sub-route prefix
const ADMIN_ROUTE_ROLES: { prefix: string; roles: string[] }[] = [
  { prefix: "/admin/orders", roles: ["ADMIN",] },
  { prefix: "/admin/delivery", roles: ["ADMIN",] },
  { prefix: "/admin/inventory", roles: ["ADMIN",] },
  { prefix: "/admin/accounting", roles: ["ADMIN",] },
  { prefix: "/admin/users", roles: ["ADMIN"] },
  { prefix: "/admin/staff", roles: ["ADMIN"] },
  { prefix: "/admin/analytics", roles: ["ADMIN",] },
];

// Role-specific dashboard routes (non-admin)
const ROLE_ROUTES: { prefix: string; roles: string[] }[] = [
  { prefix: "/sales-rep", roles: ["ADMIN", "SALES_REP"] },
  { prefix: "/delivery-agents", roles: ["ADMIN", "DELIVERY_AGENT"] },
  { prefix: "/data", roles: ["ADMIN", "DATA_ANALYST"] },
  { prefix: "/accounting", roles: ["ADMIN", "ACCOUNTANT"] },
  { prefix: "/inventory", roles: ["ADMIN", "INVENTORY_MANAGER"] },
  { prefix: "/warehouse", roles: ["ADMIN", "WAREHOUSE_MANAGER"] },
  { prefix: "/logistics", roles: ["ADMIN", "LOGISTICS_MANAGER"] },
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
          // No explicit entry → admin-only
          if (role !== "ADMIN") {
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
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  providers: [],
};
