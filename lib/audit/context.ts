import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Request-scoped flag telling the audit camera (the Prisma extension) to stay
 * silent for the writes of the current action — used so an action that writes
 * its own rich `logActivity` row doesn't also get a generic auto-row.
 *
 * We use AsyncLocalStorage (not React `cache()`): only ALS reliably propagates
 * through `await` INTO the Prisma extension's callback during a server action.
 * `cache()` state did not cross that boundary, which is why the earlier flag
 * approach silently failed.
 */
const suppressionALS = new AsyncLocalStorage<boolean>();

/**
 * Silence the camera for the remainder of the current action.
 *
 * `enterWith` sets the ALS store for the rest of THIS synchronous execution and
 * every async operation that follows it in the same context (the DB writes and
 * the extension callbacks that wrap them) — so it works as a one-liner without
 * having to wrap the writes. Each request runs in its own async context, so this
 * never leaks across requests.
 */
export function suppressCameraForRequest(): void {
  suppressionALS.enterWith(true);
}

/** True when the current async context has silenced the camera. */
export function isCameraSuppressed(): boolean {
  return suppressionALS.getStore() === true;
}

/**
 * Scoped variant: runs `fn` with the camera silenced only for its duration.
 * Equivalent, callback-wrapping form of `suppressCameraForRequest()`.
 */
export function withoutCameraAudit<T>(fn: () => Promise<T>): Promise<T> {
  return suppressionALS.run(true, fn);
}
