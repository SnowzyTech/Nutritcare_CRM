import Link from "next/link";

/**
 * Logistics reports section. The (logistics) group layout already gates the
 * route by role, so this only supplies the tab strip.
 */

const TABS = [
  { href: "/logistics/reports/daily", label: "Daily Executive Update" },
  { href: "/logistics/reports/monthly", label: "Monthly Logistics Report" },
];

export default function LogisticsReportsLayout({ children }: { children: React.ReactNode }) {
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
