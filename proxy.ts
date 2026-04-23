import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";

/**
 * Middleware for route protection.
 *
 * Uses authConfig (Edge-safe, no Prisma) to guard routes.
 * The authorized() callback in authConfig handles redirect logic.
 */
export default NextAuth(authConfig).auth;

export const config = {
  /*
   * Match all routes EXCEPT:
   * - _next/static  (static files)
   * - _next/image   (image optimization)
   * - favicon.ico
   * - public folder files
   */
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
