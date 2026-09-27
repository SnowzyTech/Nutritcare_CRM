import { prisma } from "@/lib/db/prisma";
import { previousPeriod, type Period, type PeriodType } from "@/lib/lagos-time";
import { TARGET_METRICS, type TargetMetric } from "@/modules/reports/sales/metrics";

/**
 * Sales targets — set per team, per metric, for each period (day / week / month /
 * quarter separately). The company target is the SUM of team targets.
 */

export type SalesTeam = { id: string; name: string; ghana: boolean };

const GHANA = /ghana/i;

/** Teams in the SALES department. Ghana teams are flagged (GHC is not set up yet). */
export async function getSalesTeams(): Promise<SalesTeam[]> {
  const teams = await prisma.team.findMany({
    where: { department: "SALES" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return teams.map((t) => ({ ...t, ghana: GHANA.test(t.name) }));
}

export type TargetMap = Map<string, Partial<Record<TargetMetric, number>>>;

export async function getTargets(type: PeriodType, periodKey: string): Promise<TargetMap> {
  const rows = await prisma.salesTarget.findMany({
    where: { periodType: type, periodStart: periodKey },
    select: { teamId: true, metric: true, value: true },
  });
  const map: TargetMap = new Map();
  for (const r of rows) {
    const team = map.get(r.teamId) ?? {};
    team[r.metric as TargetMetric] = Number(r.value);
    map.set(r.teamId, team);
  }
  return map;
}

/** Company target for a metric = Σ team targets; null when no team has one. */
export function companyTarget(map: TargetMap, metric: TargetMetric, teamIds?: string[]): number | null {
  let sum = 0;
  let any = false;
  for (const [teamId, metrics] of map) {
    if (teamIds && !teamIds.includes(teamId)) continue;
    const v = metrics[metric];
    if (v !== undefined) {
      sum += v;
      any = true;
    }
  }
  return any ? sum : null;
}

export type TargetEntry = { teamId: string; metric: TargetMetric; value: number | null };

/** Upserts the given cells; a null value clears that target. */
export async function saveTargets(
  period: Period,
  entries: TargetEntry[],
  userId: string,
): Promise<void> {
  const validMetrics = new Set<string>(TARGET_METRICS.map((m) => m.value));
  const teams = new Set((await getSalesTeams()).filter((t) => !t.ghana).map((t) => t.id));
  const clean = entries.filter((e) => teams.has(e.teamId) && validMetrics.has(e.metric));

  await prisma.$transaction(
    clean.map((e) => {
      const where = {
        periodType_periodStart_teamId_metric: {
          periodType: period.type,
          periodStart: period.key,
          teamId: e.teamId,
          metric: e.metric,
        },
      };
      return e.value === null
        ? prisma.salesTarget.deleteMany({
            where: { periodType: period.type, periodStart: period.key, teamId: e.teamId, metric: e.metric },
          })
        : prisma.salesTarget.upsert({
            where,
            create: {
              periodType: period.type,
              periodStart: period.key,
              teamId: e.teamId,
              metric: e.metric,
              value: e.value,
              setById: userId,
            },
            update: { value: e.value, setById: userId },
          });
    }),
  );
}

/** Copies the previous period's targets into cells that are still empty. Returns how many were copied. */
export async function copyPreviousTargets(period: Period, userId: string): Promise<number> {
  const prev = previousPeriod(period);
  const [from, existing] = await Promise.all([getTargets(prev.type, prev.key), getTargets(period.type, period.key)]);
  const entries: TargetEntry[] = [];
  for (const [teamId, metrics] of from) {
    for (const [metric, value] of Object.entries(metrics) as [TargetMetric, number][]) {
      if (existing.get(teamId)?.[metric] === undefined) entries.push({ teamId, metric, value });
    }
  }
  if (entries.length) await saveTargets(period, entries, userId);
  return entries.length;
}
