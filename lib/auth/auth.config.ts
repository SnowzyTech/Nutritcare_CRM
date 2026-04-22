import type { NextAuthConfig } from "next-auth";

const PUBLIC_AUTH_PAGES = ["/login", "/signup", "/admin/login"];

// Which roles may access each protected sub-route prefix
const ROUTE_ROLES: { prefix: string; roles: string[] }[] = [
  { prefix: "/admin/orders", roles: ["ADMIN", "SALES_REP"] },
  { prefix: "/admin/delivery", roles: ["ADMIN", "DELIVERY_AGENT", "LOGISTICS_MANAGER"] },
  { prefix: "/admin/inventory", roles: ["ADMIN", "INVENTORY_MANAGER", "WAREHOUSE_MANAGER"] },
  { prefix: "/admin/finance", roles: ["ADMIN", "ACCOUNTANT"] },
  { prefix: "/admin/users", roles: ["ADMIN"] },
  { prefix: "/admin/staff", roles: ["ADMIN"] },
  { prefix: "/admin/analytics", roles: ["ADMIN", "DATA_ANALYST"] },
];

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;
      if (path === "/dashboard") {
        return Response.redirect(new URL("/admin", nextUrl));
      }
      const isAuthPage = PUBLIC_AUTH_PAGES.includes(path);
      const isAdminRoute = path.startsWith("/admin") && path !== "/admin/login";

      // Redirect authenticated users away from auth pages
      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL("/admin", nextUrl));
      }

      // Unauthenticated users cannot access admin routes
      if (isAdminRoute && !isLoggedIn) {
        return false;
      }

      // Role-based access for admin sub-routes
      if (isAdminRoute && isLoggedIn) {
        const role = auth.user?.role as string | undefined;

        const matched = ROUTE_ROLES.find((r) => path.startsWith(r.prefix));
        if (matched && role && !matched.roles.includes(role)) {
          return Response.redirect(new URL("/admin", nextUrl));
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
