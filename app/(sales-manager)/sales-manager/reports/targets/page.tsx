import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import {
  PERIOD_NOUN,
  PERIOD_TYPES,
  isPeriodType,
  nextPeriod,
  periodContaining,
  periodFromKey,
  previousPeriod,
  type PeriodType,
} from "@/lib/lagos-time";
import { cn } from "@/lib/utils";
import { getSalesTeams, getTargets } from "@/modules/reports/sales/services/targets.service";
import { PeriodNav } from "@/components/reports/sales/period-nav";
import { TargetsGrid } from "./targets-grid";

export const metadata: Metadata = { title: "Sales targets" };
export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

const TYPE_LABEL: Record<PeriodType, string> = { DAY: "Daily", WEEK: "Weekly", MONTH: "Monthly", QUARTER: "Quarterly" };

const href = (type: PeriodType, key: string) => `/sales-manager/reports/targets?type=${type}&date=${key}`;

/**
 * Targets per team, per metric, set separately for each day / week / month /
 * quarter. The company target on the reports is the sum of these.
 */
export default async function TargetsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const typeRaw = typeof sp.type === "string" ? sp.type : undefined;
  const type: PeriodType = isPeriodType(typeRaw) ? typeRaw : "MONTH";
  const period = periodFromKey(type, typeof sp.date === "string" ? sp.date : undefined);

  const [session, teams, targets] = await Promise.all([auth(), getSalesTeams(), getTargets(type, period.key)]);
  const current = periodContaining(type);
  const canManage = session?.user?.role === "SALES_REP_MANAGER";
  const ghanaTeams = teams.filter((t) => t.ghana);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Sales targets</h1>
          <p className="mt-1 text-sm text-gray-500">
            Set each team&apos;s target for every metric. The company target on the reports is the sum of the teams.
          </p>
        </div>
        <PeriodNav
          label={period.label}
          noun={PERIOD_NOUN[type]}
          prevHref={href(type, previousPeriod(period).key)}
          nextHref={href(type, nextPeriod(period).key)}
          currentHref={href(type, current.key)}
          isCurrent={current.key === period.key}
        />
      </header>

      <div className="flex flex-wrap gap-1.5">
        {PERIOD_TYPES.map((t) => (
          <Link
            key={t}
            href={href(t, periodContaining(t, period.start).key)}
            className={cn(
              "rounded-lg border px-4 py-1.5 text-sm font-semibold",
              t === type ? "border-[#5C2B90] bg-[#5C2B90] text-white" : "border-gray-200 bg-white text-gray-600 hover:border-purple-300",
            )}
          >
            {TYPE_LABEL[t]}
          </Link>
        ))}
      </div>

      <TargetsGrid
        key={`${type}:${period.key}`}
        type={type}
        periodKey={period.key}
        periodLabel={period.label}
        teams={teams.filter((t) => !t.ghana).map((t) => ({ id: t.id, name: t.name }))}
        initial={Object.fromEntries([...targets.entries()])}
        canManage={canManage}
      />

      <p className="text-xs text-gray-400">
        Ghana (GHC) is not set up yet
        {ghanaTeams.length ? ` — ${ghanaTeams.map((t) => t.name).join(", ")} is excluded` : ""}. Its targets and revenue are
        never mixed with Naira.
      </p>
    </div>
  );
}
