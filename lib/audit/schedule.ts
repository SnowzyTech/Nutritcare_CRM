/**
 * Runs an audit write out-of-band — after the HTTP response is sent — so it can
 * never add latency to the business operation, sit inside its transaction, or
 * throw into it. Falls back to a detached run in non-request contexts (scripts).
 * The callback is expected to swallow its own errors.
 */
export function runAfterResponse(fn: () => Promise<void>): void {
  try {
    // Lazy-load so scripts (seed/migrate) that import prisma never need next/server.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { after } = require("next/server") as { after: (cb: () => void) => void };
    after(() => void fn());
  } catch {
    void fn();
  }
}
