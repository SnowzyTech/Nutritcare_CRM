import { redirect } from "next/navigation";

/**
 * Root route — redirect to /dashboard.
 * Middleware handles auth; if unauthenticated, it redirects to /login.
 */
export default function RootPage() {
  redirect("/admin");
}
