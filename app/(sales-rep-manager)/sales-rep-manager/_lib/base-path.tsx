"use client";

import { createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Whether the current viewer may perform mutating manager actions (mark orders
 * delivered/failed, move reps between teams). True only for the real
 * SALES_REP_MANAGER; a SUPER_ADMIN viewing the dashboard gets read-only access,
 * so the sales-manager layout provides `false` for them. Absent a provider
 * (e.g. the team-lead dashboard) it defaults to `false`.
 */
const CanManageContext = createContext(false);

export function CanManageProvider({
  value,
  children,
}: {
  value: boolean;
  children: React.ReactNode;
}) {
  return <CanManageContext.Provider value={value}>{children}</CanManageContext.Provider>;
}

export function useCanManage(): boolean {
  return useContext(CanManageContext);
}

/**
 * The company sales-manager and the team-lead share the exact same dashboard
 * components but live at two different URL roots:
 *   • team-lead        → /sales-rep-manager
 *   • company manager  → /sales-manager
 *
 * Rather than thread a `basePath` prop through every page, client components
 * derive it from the current pathname's first segment. This keeps a single
 * source of truth for every screen while letting each URL tree link correctly.
 */
export function useBasePath(): string {
  const pathname = usePathname();
  const first = pathname.split("/")[1];
  return first ? `/${first}` : "/sales-rep-manager";
}

/**
 * A <Link> whose `href` is automatically prefixed with the active base path.
 * Pass a root-relative href WITHOUT the base (e.g. "/orders", `/${repId}`).
 * Lets server components emit correctly-rooted links for either URL tree.
 */
export function BaseLink({
  href,
  ...rest
}: Omit<React.ComponentProps<typeof Link>, "href"> & { href: string }) {
  const base = useBasePath();
  return <Link href={`${base}${href}`} {...rest} />;
}
