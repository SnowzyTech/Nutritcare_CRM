import { prisma } from "@/lib/db/prisma";
import {
  getProductTotalsMap,
  getWarehouseStockMap,
  getAgentStockMap,
} from "@/modules/inventory/services/stock-level.service";

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
  const [products, warehouseMap, agentMap] = await Promise.all([
    prisma.product.findMany({
      where: { deletedAt: null, isActive: true },
      select: { id: true, name: true, costPrice: true, sellingPrice: true },
      orderBy: { name: "asc" },
    }),
    getWarehouseStockMap(),
    getAgentStockMap(),
  ]);

  // Sum per product across all warehouses / agents.
  return products.map((p) => {
    let warehouse = 0;
    for (const wMap of Object.values(warehouseMap)) {
      warehouse += wMap[p.id] ?? 0;
    }
    let agents = 0;
    for (const aMap of Object.values(agentMap)) {
      agents += aMap[p.id] ?? 0;
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
  return stocks.map((s) => ({
    name: s.name,
    cost: fmt(s.cost),
    selling: fmt(s.selling),
    total: s.total.toLocaleString(),
    warehouse: s.warehouse.toLocaleString(),
    agents: s.agents.toLocaleString(),
    value: fmt(s.total * s.cost),
  }));
}

export type ProductBreakdownItem = {
  id: string;
  name: string;
  stock: string;
  imageUrl: string | null;
  offers: { id: number; name: string; qty: number; price: string }[];
};

export async function getInventoryProductBreakdown(): Promise<ProductBreakdownItem[]> {
  const [products, totals] = await Promise.all([
    prisma.product.findMany({
      where: { deletedAt: null, isActive: true },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        offers: {
          select: { id: true, offerName: true, offerQuantity: true, sellingPrice: true },
          orderBy: { offerQuantity: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
    getProductTotalsMap(),
  ]);

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    stock: (totals[p.id] ?? 0).toLocaleString(),
    imageUrl: p.imageUrl,
    offers: p.offers.map((o, i) => ({
      id: i + 1,
      name: o.offerName,
      qty: o.offerQuantity,
      price: fmt(Number(o.sellingPrice)),
    })),
  }));
}

export async function getInventoryLocationView() {
  const [products, warehouses, agents, warehouseMap, agentMap] = await Promise.all([
    prisma.product.findMany({
      where: { deletedAt: null, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.warehouse.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.agent.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      select: { id: true, companyName: true, state: true },
      orderBy: { companyName: "asc" },
    }),
    getWarehouseStockMap(),
    getAgentStockMap(),
  ]);

  const productHeaders = [...products.map((p) => p.name), "Total"];

  const warehouseRows = warehouses.map((w) => {
    const map = warehouseMap[w.id] ?? {};
    const values = products.map((p) => map[p.id] ?? 0);
    const total = values.reduce((s, v) => s + v, 0);
    return { warehouse: w.name, values: [...values, total] };
  });

  const totalRow = {
    warehouse: "Total",
    values: products
      .map((_, i) => warehouseRows.reduce((s, r) => s + (r.values[i] as number), 0))
      .concat([warehouseRows.reduce((s, r) => s + (r.values[r.values.length - 1] as number), 0)]),
  };

  const agentRows = agents.map((a) => {
    const map = agentMap[a.id] ?? {};
    const values = products.map((p) => map[p.id] ?? 0);
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
