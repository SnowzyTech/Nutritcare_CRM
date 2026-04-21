import type { NextAuthConfig } from "next-auth";

const PUBLIC_AUTH_PAGES = ["/login", "/signup"];

// Which roles may access each protected sub-route prefix
const ROUTE_ROLES: { prefix: string; roles: string[] }[] = [
  { prefix: "/dashboard/orders", roles: ["ADMIN", "SALES_REP"] },
  { prefix: "/dashboard/delivery", roles: ["ADMIN", "DELIVERY_AGENT", "LOGISTICS_MANAGER"] },
  { prefix: "/dashboard/inventory", roles: ["ADMIN", "INVENTORY_MANAGER", "WAREHOUSE_MANAGER"] },
  { prefix: "/dashboard/finance", roles: ["ADMIN", "ACCOUNTANT"] },
  { prefix: "/dashboard/users", roles: ["ADMIN"] },
  { prefix: "/dashboard/analytics", roles: ["ADMIN", "DATA_ANALYST"] },
];

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;
      const isAuthPage = PUBLIC_AUTH_PAGES.includes(path);
      const isDashboardRoute = path.startsWith("/dashboard");

      // Redirect authenticated users away from auth pages
      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      // Unauthenticated users cannot access dashboard
      if (isDashboardRoute && !isLoggedIn) {
        return false;
      }

      // Role-based access for dashboard sub-routes
      if (isDashboardRoute && isLoggedIn) {
        const role = auth.user?.role as string | undefined;

        const matched = ROUTE_ROLES.find((r) => path.startsWith(r.prefix));
        if (matched && role && !matched.roles.includes(role)) {
          return Response.redirect(new URL("/dashboard", nextUrl));
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
