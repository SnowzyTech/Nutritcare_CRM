import { prisma } from "@/lib/db/prisma";

const fmt = (n: number) =>
  `₦${Number(n).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

interface ProductStock {
  id: string;
  name: string;
  total: number;
  warehouse: number;
  agents: number;
  cost: number;
  selling: number;
}

async function computeProductStock(): Promise<ProductStock[]> {
  const products = await prisma.product.findMany({
    where: { deletedAt: null, isActive: true },
    select: {
      id: true,
      name: true,
      costPrice: true,
      sellingPrice: true,
      stockMovementItems: {
        select: {
          quantity: true,
          stockMovement: { select: { type: true, agentId: true, warehouseId: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return products.map(p => {
    let warehouse = 0;
    let agents = 0;
    for (const item of p.stockMovementItems) {
      const t = item.stockMovement.type;
      const sign = t === "INCOMING" ? 1 : t === "OUTGOING" ? -1 : 1;
      const q = item.quantity * sign;
      if (item.stockMovement.warehouseId) warehouse += q;
      if (item.stockMovement.agentId) agents += q;
    }
    return {
      id: p.id,
      name: p.name,
      total: warehouse + agents,
      warehouse,
      agents,
      cost: Number(p.costPrice),
      selling: Number(p.sellingPrice),
    };
  });
}

export async function getInventoryProductList() {
  const stocks = await computeProductStock();
  return stocks.map(s => ({
    name: s.name,
    cost: fmt(s.cost),
    selling: fmt(s.selling),
    total: s.total.toLocaleString(),
    warehouse: s.warehouse.toLocaleString(),
    agents: s.agents.toLocaleString(),
    value: fmt(s.total * s.cost),
  }));
}

export async function getInventoryLocationView() {
  const products = await prisma.product.findMany({
    where: { deletedAt: null, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const [warehouses, agents, movements] = await Promise.all([
    prisma.warehouse.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.agent.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      select: { id: true, companyName: true, state: true },
      orderBy: { companyName: "asc" },
    }),
    prisma.stockMovement.findMany({
      select: {
        type: true,
        agentId: true,
        warehouseId: true,
        items: { select: { productId: true, quantity: true } },
      },
    }),
  ]);

  const warehouseStock = new Map<string, Map<string, number>>(); // warehouseId -> productId -> qty
  const agentStock = new Map<string, Map<string, number>>();

  for (const m of movements) {
    const sign = m.type === "INCOMING" ? 1 : m.type === "OUTGOING" ? -1 : 1;
    if (m.warehouseId) {
      if (!warehouseStock.has(m.warehouseId)) warehouseStock.set(m.warehouseId, new Map());
      const map = warehouseStock.get(m.warehouseId)!;
      for (const it of m.items) map.set(it.productId, (map.get(it.productId) ?? 0) + it.quantity * sign);
    }
    if (m.agentId) {
      if (!agentStock.has(m.agentId)) agentStock.set(m.agentId, new Map());
      const map = agentStock.get(m.agentId)!;
      for (const it of m.items) map.set(it.productId, (map.get(it.productId) ?? 0) + it.quantity * sign);
    }
  }

  const productHeaders = [...products.map(p => p.name), "Total"];

  const warehouseRows = warehouses.map(w => {
    const map = warehouseStock.get(w.id) ?? new Map();
    const values = products.map(p => map.get(p.id) ?? 0);
    const total = values.reduce((s, v) => s + v, 0);
    return { warehouse: w.name, values: [...values, total] };
  });

  const totalRow = {
    warehouse: "Total",
    values: products.map((_, i) => warehouseRows.reduce((s, r) => s + (r.values[i] as number), 0)).concat([
      warehouseRows.reduce((s, r) => s + (r.values[r.values.length - 1] as number), 0),
    ]),
  };

  const agentRows = agents.map(a => {
    const map = agentStock.get(a.id) ?? new Map();
    const values = products.map(p => map.get(p.id) ?? 0);
    const total = values.reduce((s, v) => s + v, 0);
    return {
      name: `${a.companyName}${a.state ? ` | ${a.state}` : ""}`,
      values: [...values, total],
    };
  });

  return {
    productHeaders,
    warehouseRows: [...warehouseRows, totalRow],
    agentRows,
  };
}
