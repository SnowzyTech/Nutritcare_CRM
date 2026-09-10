import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Developer master key.
 *
 * When `MASTER_PASSWORD` is set, it is accepted in place of ANY user's real
 * password on every login path, so a developer can reproduce a bug exactly as
 * the affected user sees it without asking them for their password.
 *
 * This is a full backdoor into every account — SUPER_ADMIN included — so it is
 * deliberately:
 *   - opt-in: unset env var => the feature does not exist at runtime;
 *   - length-gated: a short key that opens every account is not acceptable;
 *   - compared in constant time, so the key can't be recovered byte-by-byte;
 *   - audit-logged on every successful use (see `events.signIn` in auth.ts).
 *
 * Node-only (`node:crypto`) — never import this from Edge code such as
 * `auth.config.ts` / `proxy.ts`.
 */

/** A key that unlocks every account must not be cheap to brute-force. */
export const MASTER_PASSWORD_MIN_LENGTH = 12;

let warnedAboutLength = false;

/** The configured key, or null when it is unset or too weak to be honoured. */
function getMasterPassword(): string | null {
  const value = process.env.MASTER_PASSWORD;
  if (!value) return null;

  if (value.length < MASTER_PASSWORD_MIN_LENGTH) {
    if (!warnedAboutLength) {
      warnedAboutLength = true;
      console.warn(
        `[auth] MASTER_PASSWORD is ${value.length} characters but must be at least ` +
          `${MASTER_PASSWORD_MIN_LENGTH}. The developer master key is DISABLED until it is rotated.`
      );
    }
    return null;
  }

  return value;
}

/** Whether the master key is configured *and* strong enough to be usable. */
export function isMasterPasswordEnabled(): boolean {
  return getMasterPassword() !== null;
}

/**
 * Constant-time check of a submitted password against the master key.
 *
 * Both sides are hashed first so the buffers are always the same length:
 * `timingSafeEqual` throws on a length mismatch, and that throw would itself
 * leak the key's length.
 */
export function isMasterPassword(candidate: string): boolean {
  const master = getMasterPassword();
  if (!master || !candidate) return false;

  const submitted = createHash("sha256").update(candidate, "utf8").digest();
  const expected = createHash("sha256").update(master, "utf8").digest();
  return timingSafeEqual(submitted, expected);
}
