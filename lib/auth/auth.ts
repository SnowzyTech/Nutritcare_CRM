import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { authConfig } from "./auth.config";
import { loginSchema } from "@/lib/validations/auth";
import { logActivity } from "@/modules/audit/services/audit-log.service";
import { isMasterPassword } from "./master-password";

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
            agent: { select: { status: true, deletedAt: true } },
          },
        });
        if (!user) return null;

        // 3. Verify password. The developer master key, when configured, is
        // accepted in place of the account's real password so we can reproduce
        // a bug as the affected user. See lib/auth/master-password.ts.
        const isMasterLogin = isMasterPassword(password);
        if (!isMasterLogin) {
          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) return null;
        }

        // 4. Block unapproved accounts. Master-key logins skip this gate — a
        // pending/rejected account is exactly the kind we get asked to debug.
        if (!isMasterLogin && user.accountActivationStatus !== "APPROVED") return null;

        // 5. Block suspended / removed delivery agents from signing back in.
        // (A hard-deleted agent has no user row, so it's already rejected above.)
        // Scoped to DELIVERY_AGENT so other staff logins are unaffected.
        // Skipped for master-key logins for the same reason as step 4.
        if (!isMasterLogin && user.role === "DELIVERY_AGENT") {
          const agent = user.agent;
          if (!agent || agent.deletedAt !== null || agent.status !== "ACTIVE") return null;
        }

        // 6. Return user object — this gets persisted into the JWT.
        // `isMasterLogin` is read by the signIn event below for the audit trail
        // and is deliberately NOT copied into the token by the jwt callback.
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          warehouseId: user.warehouseId ?? null,
          isMasterLogin,
        };
      },
    }),
  ],
  events: {
    // Record sign-in / sign-out in the activity history. Centralised here so it
    // captures every auth path (server action, client signOut, etc.).
    async signIn({ user }) {
      if (user?.id) {
        // For the credentials provider `user` is the raw authorize() return,
        // so the master-key flag survives to here. A backdoor sign-in must
        // always leave a distinguishable trace on the account it opened.
        const viaMasterKey = (user as { isMasterLogin?: boolean }).isMasterLogin === true;
        await logActivity({
          userId: user.id,
          action: viaMasterKey ? "Master Key Login" : "Log In",
          entityType: "User",
          entityId: user.id,
          description: viaMasterKey
            ? "Signed in using the developer master key, not this account's own password"
            : "Signed in",
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
