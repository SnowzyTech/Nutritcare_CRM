import Link from "next/link";

/**
 * Sales reports section. Mirrors the tabbed shape of the accounting reports
 * (app/(accounting)/accounting/reports/layout.tsx) — the group layout already
 * gates the route to the company sales manager, so no extra guard is needed.
 */

const TABS = [
  { href: "/sales-manager/reports/daily", label: "Daily Executive Update" },
  { href: "/sales-manager/reports/weekly", label: "Weekly Performance Review" },
];

export default function SalesReportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-purple-50 hover:text-[#5C2B90]"
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
