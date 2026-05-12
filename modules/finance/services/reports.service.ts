import { prisma } from "@/lib/db/prisma";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export async function getAgentPerformanceReport(year: number = new Date().getFullYear()) {
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  const deliveries = await prisma.delivery.findMany({
    where: { createdAt: { gte: start, lt: end } },
    select: { status: true, createdAt: true, agentId: true, agent: { select: { companyName: true, state: true } } },
  });

  const monthly = new Array(12).fill(null).map(() => ({ delivered: 0, failed: 0 }));
  for (const d of deliveries) {
    const m = d.createdAt.getMonth();
    if (d.status === "DELIVERED") monthly[m].delivered++;
    else if (d.status === "FAILED") monthly[m].failed++;
  }
  const chartData = monthly.map((v, i) => ({ name: MONTHS[i], ...v }));

  const agentMap = new Map<string, { name: string; state: string; delivered: number; failed: number }>();
  for (const d of deliveries) {
    if (!d.agentId || !d.agent) continue;
    const cur = agentMap.get(d.agentId) ?? {
      name: d.agent.companyName,
      state: d.agent.state ?? "",
      delivered: 0,
      failed: 0,
    };
    if (d.status === "DELIVERED") cur.delivered++;
    if (d.status === "FAILED") cur.failed++;
    agentMap.set(d.agentId, cur);
  }
  const tableData = [...agentMap.values()].map(a => {
    const totalAttempts = a.delivered + a.failed;
    const performance = totalAttempts ? Math.round((a.delivered / totalAttempts) * 100) : 0;
    return {
      name: a.name,
      state: a.state,
      product: a.delivered,
      performance: `${performance}%`,
      performanceNum: performance,
    };
  });

  tableData.sort((a, b) => b.performanceNum - a.performanceNum);

  const overall = tableData.length
    ? Math.round(tableData.reduce((s, a) => s + a.performanceNum, 0) / tableData.length)
    : 0;

  return {
    chartData,
    tableData,
    summary: {
      overallPerformance: overall,
      bestAgent: tableData[0] ?? null,
    },
  };
}
