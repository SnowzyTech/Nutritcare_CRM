import { handlers } from "@/lib/auth/auth";

/**
 * Auth.js route handler.
 * Handles all /api/auth/* requests (sign-in, sign-out, session, etc.)
 */
export const { GET, POST } = handlers;
