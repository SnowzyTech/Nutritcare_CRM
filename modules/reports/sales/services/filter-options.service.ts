import { prisma } from "@/lib/db/prisma";

export type Option = { value: string; label: string };

export type FilterOptions = {
  teams: Option[];
  reps: Option[];
  products: Option[];
  agents: Option[];
  states: Option[];
};

/** Choices for the report filter bar. States come from what customers actually have on file. */
export async function getFilterOptions(): Promise<FilterOptions> {
  const [teams, reps, products, agents, states] = await Promise.all([
    prisma.team.findMany({ where: { department: "SALES" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { role: "SALES_REP" }, select: { id: true, name: true, isActive: true }, orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.agent.findMany({ where: { deletedAt: null }, select: { id: true, companyName: true }, orderBy: { companyName: "asc" } }),
    prisma.customer.groupBy({ by: ["state"], where: { state: { not: "" }, deletedAt: null }, orderBy: { state: "asc" } }),
  ]);
  return {
    teams: [...teams.map((t) => ({ value: t.id, label: t.name })), { value: "none", label: "No team" }],
    reps: reps.map((r) => ({ value: r.id, label: r.isActive ? r.name : `${r.name} (inactive)` })),
    products: products.map((p) => ({ value: p.id, label: p.name })),
    agents: agents.map((a) => ({ value: a.id, label: a.companyName })),
    states: states.map((s) => ({ value: s.state, label: s.state })),
  };
}
