import { cache } from "react";

export type AuditActor = {
  id: string;
  name?: string | null;
  role?: string | null;
};

/**
 * The current logged-in user, resolved once per request.
 *
 * React's `cache()` memoizes the result for the lifetime of a single request,
 * so `auth()` runs at most once no matter how many DB writes the request makes
 * — and it stays request-scoped, so one user never sees another's identity.
 *
 * `auth()` is imported lazily so that pulling in `lib/db/prisma` (which the
 * camera extends) never eagerly drags NextAuth into scripts or creates an
 * import cycle. Returns `null` outside a request context (seed scripts, cron)
 * or when there is no session; the camera then skips logging rather than
 * inventing an actor (keeps `AuditLog.userId`'s foreign key valid, no schema change).
 */
export const getCurrentActor = cache(async (): Promise<AuditActor | null> => {
  try {
    const { auth } = await import("@/lib/auth/auth");
    const session = await auth();
    if (!session?.user?.id) return null;
    return {
      id: session.user.id,
      name: session.user.name,
      role: session.user.role,
    };
  } catch {
    return null;
  }
});
