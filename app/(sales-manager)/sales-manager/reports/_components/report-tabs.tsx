"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/sales-manager/reports/daily", label: "Daily" },
  { href: "/sales-manager/reports/weekly", label: "Weekly" },
  { href: "/sales-manager/reports/monthly", label: "Monthly" },
  { href: "/sales-manager/reports/quarterly", label: "Quarterly" },
  { href: "/sales-manager/reports/targets", label: "Targets" },
  { href: "/sales-manager/reports/data-checks", label: "Data checks" },
  { href: "/sales-manager/reports/saved", label: "Saved reports" },
];

export function ReportTabs() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-1.5 border-b border-gray-200 pb-3">
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-semibold transition",
              active ? "bg-[#5C2B90] text-white" : "text-gray-600 hover:bg-purple-50 hover:text-[#5C2B90]",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
