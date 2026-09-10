import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      warehouseId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    warehouseId?: string | null;
    /**
     * True when this sign-in used the developer master key instead of the
     * account's own password. Set by the credentials provider's authorize()
     * and consumed by the signIn event for the audit trail — intentionally
     * never copied into the JWT or the session.
     */
    isMasterLogin?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    warehouseId?: string | null;
  }
}
