import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { authConfig } from "./auth.config";
import { loginSchema } from "@/lib/validations/auth";
import { logActivity } from "@/modules/audit/services/audit-log.service";

/**
 * Main Auth.js setup.
 *
 * Exports: handlers (GET/POST for API route), signIn, signOut, auth (session getter).
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // 1. Validate input shape with Zod
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // 2. Fetch user from DB
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true, name: true, email: true, role: true,
            password: true, accountActivationStatus: true,
            warehouseId: true,
          },
        });
        if (!user) return null;

        // 3. Verify password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        // 4. Block unapproved accounts
        if (user.accountActivationStatus !== "APPROVED") return null;

        // 5. Return user object — this gets persisted into the JWT
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          warehouseId: user.warehouseId ?? null,
        };
      },
    }),
  ],
  events: {
    // Record sign-in / sign-out in the activity history. Centralised here so it
    // captures every auth path (server action, client signOut, etc.).
    async signIn({ user }) {
      if (user?.id) {
        await logActivity({
          userId: user.id,
          action: "Log In",
          entityType: "User",
          entityId: user.id,
          description: "Signed in",
        });
      }
    },
    async signOut(message) {
      const token = "token" in message ? message.token : null;
      const userId = (token?.id as string | undefined) ?? token?.sub;
      if (userId) {
        await logActivity({
          userId,
          action: "Log Out",
          entityType: "User",
          entityId: userId,
          description: "Signed out",
        });
      }
    },
  },
});
