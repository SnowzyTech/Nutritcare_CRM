import { prisma } from "@/lib/db/prisma";
import {
  getProductTotalsMap,
  getWarehouseStockMap,
  getAgentStockMap,
} from "./stock-level.service";

// ── Types ────────────────────────────────────────────────────────────────────

export type StockLevelRow = {
  id: string;
  sku: string;
  category: string;
  product: string;
  qty: number;
  min: number;
  status: "OK" | "Low" | "Watch";
};

export type PurchaseOrderRow = {
  id: string;
  poNumber: string;
  supplier: string;
  items: string;
  date: string;
  status: string;
};

export type ChartDataPoint = {
  name: string;
  received: number;
  dispatched: number;
};

export type AlertRow = {
  id: string;
  type: "reorder" | "expiry" | "audit";
  message: string;
  timestamp: string;
  color: string;
};

export type IncomingMovementRow = {
  id: string;
  date: string;
  siId: string;
  supplier: string;
  warehouse: string;
  supplierRef: string;
  product: string;
  status: string;
  createdTime: string;
  addedBy: string;
};

export type OutgoingMovementRow = {
  id: string;
  date: string;
  productName: string;
  state: string;
  agent: string;
  otherInfo: string;
  qtySent: number;
  status: string;
  addedBy: string;
};

export type ReturnedMovementRow = {
  id: string;
  date: string;
  productName: string;
  state: string;
  agent: string;
  qtyReturned: number;
  damaged: "Yes" | "No";
  remarks: string;
  warehouse: string;
  addedBy: string;
};

export type StockTransferRow = {
  id: string;
  transferId: string;
  date: string;
  from: string;
  to: string;
  warehouseManager: string;
  items: number;
  totalQty: number;
  status: string;
  addedBy: string;
};

export type WarehouseStockRow = {
  id: string;
  productName: string;
  warehouse: string;
  qtyRecorded: number;
  qtyLeft: number;
};

export type AgentStockRow = {
  id: string;
  productName: string;
  state: string;
  agentName: string;
  qtySent: number;
  qtySold: number;
  qtyLeft: number;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function sevenDaysAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function formatMovementDate(date: Date): string {
  return date.toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" });
}

function formatMovementTime(date: Date): string {
  return date.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", hour12: true }).toLowerCase();
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export async function getInventoryDashboardData() {
  const [products, totalsMap, purchaseOrders, recentMovements] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, deletedAt: null },
      include: { category: true },
    }),
    getProductTotalsMap(),
    prisma.purchaseOrder.findMany({
      where: { status: { in: ["PENDING", "IN_TRANSIT"] } },
      include: { supplier: true, items: { include: { product: true } } },
      orderBy: { date: "desc" },
      take: 5,
    }),
    prisma.stockMovement.findMany({
      where: { date: { gte: sevenDaysAgo() } },
      include: { items: true },
    }),
  ]);

  const stockLevels: StockLevelRow[] = products.map((p) => {
    const qty = totalsMap[p.id] ?? 0;
    const min = p.lowStockAlertQtyTotal ?? 50;
    const status: "OK" | "Low" | "Watch" =
      qty < min ? "Low" : qty < min * 1.5 ? "Watch" : "OK";
    return { id: p.id, sku: p.sku, category: p.category.categoryName, product: p.name, qty, min, status };
  });

  const lowStockCount = stockLevels.filter((s) => s.status === "Low").length;
  const totalSkus = products.length;
  const openPoCount = purchaseOrders.length;

  // Reorder table rows (from open POs)
  const reorderRows: PurchaseOrderRow[] = purchaseOrders.map((po) => ({
    id: po.id,
    poNumber: po.poNumber,
    supplier: po.supplier.name,
    items: po.items.map((i) => i.product.name).join(", "),
    date: po.date.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", hour12: true }),
    status: po.status === "IN_TRANSIT" ? "In Transit" : "Pending",
  }));

  // Chart data: last 7 days
  const dayChartMap = new Map<string, { name: string; received: number; dispatched: number }>();
  for (let i = 6; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    day.setHours(0, 0, 0, 0);
    dayChartMap.set(day.toDateString(), { name: DAY_NAMES[day.getDay()], received: 0, dispatched: 0 });
  }
  for (const movement of recentMovements) {
    const key = movement.date.toDateString();
    const entry = dayChartMap.get(key);
    if (!entry) continue;
    const qty = movement.items.reduce((sum, i) => sum + i.quantity, 0);
    if (movement.type === "INCOMING") entry.received += qty;
    else if (movement.type === "OUTGOING") entry.dispatched += qty;
  }
  const chartData = Array.from(dayChartMap.values());
  const receivedTotal = chartData.reduce((s, d) => s + d.received, 0);
  const dispatchedTotal = chartData.reduce((s, d) => s + d.dispatched, 0);

  // Alerts: low stock
  const alerts: AlertRow[] = stockLevels
    .filter((s) => s.status !== "OK")
    .slice(0, 5)
    .map((s, i) => ({
      id: s.id,
      type: "reorder" as const,
      message: `${s.product} is ${s.status === "Low" ? "below" : "near"} minimum — ${s.qty} units remaining (min: ${s.min})`,
      timestamp: i === 0 ? "Just now" : `${(i + 1) * 12} min ago`,
      color: s.status === "Low" ? "#EF4444" : "#F59E0B",
    }));

  return {
    totalSkus,
    lowStockCount,
    openPoCount,
    stockLevels,
    reorderRows,
    chartData,
    receivedTotal,
    dispatchedTotal,
    alerts,
  };
}

// ── Incoming ─────────────────────────────────────────────────────────────────

export async function getIncomingMovements(): Promise<IncomingMovementRow[]> {
  const movements = await prisma.stockMovement.findMany({
    where: { type: "INCOMING" },
    include: {
      supplier: true,
      warehouse: true,
      createdBy: true,
      items: { include: { product: true } },
    },
    orderBy: { date: "desc" },
  });

  return movements.map((m) => ({
    id: m.id,
    date: formatMovementDate(m.date),
    siId: m.referenceNumber,
    supplier: m.supplier?.name ?? "—",
    warehouse: m.warehouse?.name ?? "—",
    supplierRef: m.supplierReference ?? "—",
    product: m.items.map((i) => i.product.name).join(", ") || "—",
    status: m.status === "RECORDED" ? "Recorded" : m.status === "DRAFT" ? "Draft" : m.status,
    createdTime: formatMovementTime(m.createdAt),
    addedBy: m.createdBy.name,
  }));
}

// ── Outgoing ─────────────────────────────────────────────────────────────────

export async function getOutgoingMovements(): Promise<OutgoingMovementRow[]> {
  const movements = await prisma.stockMovement.findMany({
    where: { type: "OUTGOING" },
    include: {
      agent: true,
      toAgent: true,
      createdBy: true,
      items: { include: { product: true } },
    },
    orderBy: { date: "desc" },
  });

  return movements.map((m) => {
    const totalQty = m.items.reduce((sum, i) => sum + i.quantity, 0);
    const statusMap: Record<string, string> = {
      NOT_RECEIVED: "Not Received",
      RECEIVED: "Received",
      DRAFT: "Draft",
    };
    return {
      id: m.id,
      date: formatMovementDate(m.date),
      productName: m.items.map((i) => i.product.name).join(", ") || "—",
      state: m.state ?? "—",
      agent: m.isAgentToAgentTransfer 
        ? `${m.agent?.companyName ?? "Unknown"} → ${m.toAgent?.companyName ?? "Unknown"}`
        : (m.toAgent?.companyName ?? m.agent?.companyName ?? "—"),
      otherInfo: m.toAgent?.phone1 ?? m.agent?.phone1 ?? "—",
      qtySent: totalQty,
      status: statusMap[m.status] ?? m.status,
      addedBy: m.createdBy.name,
    };
  });
}

// ── Returned ─────────────────────────────────────────────────────────────────

export async function getReturnedMovements(): Promise<ReturnedMovementRow[]> {
  const movements = await prisma.stockMovement.findMany({
    where: { type: "RETURN" },
    include: {
      agent: true,
      warehouse: true,
      createdBy: true,
      items: { include: { product: true } },
    },
    orderBy: { date: "desc" },
  });

  return movements.map((m) => {
    const totalQty = m.items.reduce((sum, i) => sum + i.quantity, 0);
    return {
      id: m.id,
      date: formatMovementDate(m.date),
      productName: m.items.map((i) => i.product.name).join(", ") || "—",
      state: m.state ?? "—",
      agent: m.agent?.companyName ?? "—",
      qtyReturned: totalQty,
      damaged: m.damaged ? "Yes" : "No",
      remarks: m.remarks ?? "—",
      warehouse: m.warehouse?.name ?? "—",
      addedBy: m.createdBy.name,
    };
  });
}

// ── Transfers ─────────────────────────────────────────────────────────────────

export async function getStockTransfers(): Promise<StockTransferRow[]> {
  const transfers = await prisma.stockTransfer.findMany({
    include: {
      createdBy: true,
      items: { include: { product: true } },
    },
    orderBy: { date: "desc" },
  });

  // Collect all unique warehouse/agent IDs
  const whIds = transfers
    .flatMap((t) => [
      t.sourceType === "WAREHOUSE" ? t.sourceId : null,
      t.targetType === "WAREHOUSE" ? t.targetId : null,
    ])
    .filter(Boolean) as string[];
  const agentIds = transfers
    .flatMap((t) => [
      t.sourceType === "AGENT" ? t.sourceId : null,
      t.targetType === "AGENT" ? t.targetId : null,
    ])
    .filter(Boolean) as string[];

  const [warehouses, agents] = await Promise.all([
    whIds.length > 0
      ? prisma.warehouse.findMany({ where: { id: { in: whIds } }, select: { id: true, name: true, managerName: true } })
      : [],
    agentIds.length > 0
      ? prisma.agent.findMany({ where: { id: { in: agentIds } }, select: { id: true, companyName: true } })
      : [],
  ]);

  const whMap = new Map(warehouses.map((w) => [w.id, w]));
  const agentMap = new Map(agents.map((a) => [a.id, a]));

  function resolveName(type: string, id: string): string {
    if (type === "WAREHOUSE") return whMap.get(id)?.name ?? id;
    return agentMap.get(id)?.companyName ?? id;
  }

  function resolveManager(type: string, id: string): string {
    if (type === "WAREHOUSE") return whMap.get(id)?.managerName ?? "—";
    return agentMap.get(id)?.companyName ?? "—";
  }

  const statusMap: Record<string, string> = {
    DRAFT: "DRAFT",
    SUBMITTED: "RECORDED",
    COMPLETED: "RECORDED",
  };

  return transfers.map((t) => {
    const totalQty = t.items.reduce((sum, i) => sum + i.quantity, 0);
    return {
      id: t.id,
      transferId: t.referenceNumber,
      date: formatMovementDate(t.date),
      from: resolveName(t.sourceType, t.sourceId),
      to: resolveName(t.targetType, t.targetId),
      warehouseManager: resolveManager(t.sourceType, t.sourceId),
      items: t.items.length,
      totalQty,
      status: statusMap[t.status] ?? t.status,
      addedBy: t.createdBy.name,
    };
  });
}

// ── Stock in Warehouse ────────────────────────────────────────────────────────

export async function getStockInWarehouse(): Promise<WarehouseStockRow[]> {
  const [levels, warehouses, products] = await Promise.all([
    prisma.stockLevel.findMany({
      where: { locationKind: "WAREHOUSE", quantity: { gt: 0 } },
      select: { productId: true, locationId: true, quantity: true },
    }),
    prisma.warehouse.findMany({ select: { id: true, name: true } }),
    prisma.product.findMany({ select: { id: true, name: true } }),
  ]);

  const whMap = new Map(warehouses.map((w) => [w.id, w.name]));
  const productNameMap = new Map(products.map((p) => [p.id, p.name]));

  return levels
    .map((l) => ({
      id: `${l.productId}::${l.locationId}`,
      productName: productNameMap.get(l.productId) ?? l.productId,
      warehouse: whMap.get(l.locationId) ?? l.locationId,
      qtyRecorded: l.quantity,
      qtyLeft: l.quantity,
    }))
    .sort((a, b) => a.productName.localeCompare(b.productName));
}

// ── Stock Page Tab Types & Queries ───────────────────────────────────────────

export type StockAgentRow = {
  id: string;
  companyName: string;
  state: string;
  address: string;
  phones: string[];
  status: string;
  addedBy: string;
};

export type StockSupplierRow = {
  id: string;
  name: string;
  address: string;
  phones: string[];
};

export type StockWarehouseRow = {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
  managerName: string;
};

export type StockProductRow = {
  id: string;
  name: string;
  categoryName: string;
  country: string;
  sku: string;
  costPrice: number;
  sellingPrice: number;
  stockLeft: number;
};

export type StockCategoryRow = {
  id: string;
  categoryName: string;
  brandName: string;
  brandPhoneEmail: string[];
  brandWhatsapp: string;
  senderId: string;
};

export async function getStockAgents(): Promise<StockAgentRow[]> {
  const agents = await prisma.agent.findMany({
    where: { deletedAt: null },
    include: { addedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return agents.map((a) => ({
    id: a.id,
    companyName: a.companyName,
    state: a.state ?? "—",
    address: a.address ?? "—",
    phones: [a.phone1, a.phone2].filter(Boolean) as string[],
    status: a.status === "ACTIVE" ? "Active" : a.status === "INACTIVE" ? "Inactive" : a.status,
    addedBy: a.addedBy.name,
  }));
}

export async function getStockSuppliers(): Promise<StockSupplierRow[]> {
  const suppliers = await prisma.supplier.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
  return suppliers.map((s) => ({
    id: s.id,
    name: s.name,
    address: [s.address, s.state].filter(Boolean).join(", ") || "—",
    phones: [s.phone1, s.phone2].filter(Boolean) as string[],
  }));
}

export async function getStockWarehouses(): Promise<StockWarehouseRow[]> {
  const warehouses = await prisma.warehouse.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
  return warehouses.map((w) => ({
    id: w.id,
    name: w.name,
    phone: w.phone ?? "—",
    createdAt: w.createdAt.toLocaleDateString("en-NG"),
    managerName: w.managerName ?? "—",
  }));
}

export async function getStockProducts(): Promise<StockProductRow[]> {
  const [products, totalsMap] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, deletedAt: null },
      include: { category: true },
      orderBy: { name: "asc" },
    }),
    getProductTotalsMap(),
  ]);

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    categoryName: p.category.categoryName,
    country: p.country ?? "—",
    sku: p.sku,
    costPrice: Number(p.costPrice),
    sellingPrice: Number(p.sellingPrice),
    stockLeft: totalsMap[p.id] ?? 0,
  }));
}

export async function getStockCategories(): Promise<StockCategoryRow[]> {
  const cats = await prisma.productCategory.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
  return cats.map((c) => ({
    id: c.id,
    categoryName: c.categoryName,
    brandName: c.brandName,
    brandPhoneEmail: [c.brandPhone, c.brandEmail].filter(Boolean) as string[],
    brandWhatsapp: c.brandWhatsappNumber ?? "—",
    senderId: c.smsSenderId ?? "—",
  }));
}

// ── Detail Page Types & Queries ───────────────────────────────────────────────

type DetailProduct = { id: number; product: string; productCode: string; quantity: number };
type DetailProductWithUnit = DetailProduct & { unit: string };

export type IncomingMovementDetail = {
  id: string;
  siId: string;
  warehouse: string;
  supplier: string;
  supplierRef: string;
  recordedBy: string;
  dateReceived: string;
  status: string;
  reversalReason: string | null;
  dateReversed: string | null;
  products: DetailProduct[];
};

export type OutgoingMovementDetail = {
  id: string;
  soId: string;
  state: string;
  country: string;
  agent: string;
  supplierReference: string;
  addedBy: string;
  date: string;
  status: string;
  reversalReason: string | null;
  dateReversed: string | null;
  products: DetailProduct[];
};

export type ReturnedMovementDetail = {
  id: string;
  rsId: string;
  agent: string;
  qtyReturned: number;
  status: string;
  damaged: boolean;
  addedBy: string;
  date: string;
  remarks: string;
  products: DetailProductWithUnit[];
};

export type StockTransferDetail = {
  id: string;
  transferId: string;
  sourceWarehouseAgent: string;
  targetWarehouseAgent: string;
  transferReference: string;
  addedBy: string;
  date: string;
  status: string;
  reversalReason: string | null;
  dateReversed: string | null;
  products: DetailProductWithUnit[];
};

export async function getIncomingMovementById(id: string): Promise<IncomingMovementDetail | null> {
  const m = await prisma.stockMovement.findUnique({
    where: { id },
    include: {
      supplier: true,
      warehouse: true,
      createdBy: true,
      items: { include: { product: true } },
    },
  });
  if (!m || m.type !== "INCOMING") return null;

  const statusLabel: Record<string, string> = {
    DRAFT: "Draft", RECORDED: "Recorded", RECEIVED: "Received", SHELVED: "Shelved", REVERSED: "Reversed",
  };

  return {
    id: m.id,
    siId: m.referenceNumber,
    warehouse: m.warehouse?.name ?? "—",
    supplier: m.supplier?.name ?? "—",
    supplierRef: m.supplierReference ?? "—",
    recordedBy: m.createdBy.name,
    dateReceived: formatMovementDate(m.date),
    status: statusLabel[m.status] ?? m.status,
    reversalReason: m.status === "REVERSED" ? (m.remarks ?? null) : null,
    dateReversed: m.status === "REVERSED" ? formatMovementDate(m.updatedAt) : null,
    products: m.items.map((item, i) => ({
      id: i + 1,
      product: item.product.name,
      productCode: item.product.sku,
      quantity: item.quantity,
    })),
  };
}

export async function getIncomingMovementForEdit(id: string) {
  const m = await prisma.stockMovement.findUnique({
    where: { id },
    include: {
      items: true,
    },
  });
  if (!m || m.type !== "INCOMING") return null;

  return {
    ...m,
    date: m.date.toISOString().split("T")[0],
    items: m.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productCode: item.productCode,
      quantity: item.quantity,
    })),
  };
}

export async function getOutgoingMovementById(id: string): Promise<OutgoingMovementDetail | null> {
  const m = await prisma.stockMovement.findUnique({
    where: { id },
    include: {
      agent: true,
      toAgent: true,
      createdBy: true,
      items: { include: { product: true } },
    },
  });
  if (!m || m.type !== "OUTGOING") return null;

  const statusLabel: Record<string, string> = {
    DRAFT: "Draft", NOT_RECEIVED: "Not Received", RECEIVED: "Received", REVERSED: "Reversed",
  };

  return {
    id: m.id,
    soId: m.referenceNumber,
    state: m.state ?? m.agent?.state ?? m.toAgent?.state ?? "—",
    country: m.agent?.country ?? m.toAgent?.country ?? "Nigeria",
    agent: m.isAgentToAgentTransfer 
      ? `${m.agent?.companyName ?? "Unknown"} → ${m.toAgent?.companyName ?? "Unknown"}`
      : (m.toAgent?.companyName ?? m.agent?.companyName ?? "—"),
    supplierReference: m.supplierReference ?? "—",
    addedBy: m.createdBy.name,
    date: formatMovementDate(m.date),
    status: statusLabel[m.status] ?? m.status,
    reversalReason: m.status === "REVERSED" ? (m.remarks ?? null) : null,
    dateReversed: m.status === "REVERSED" ? formatMovementDate(m.updatedAt) : null,
    products: m.items.map((item, i) => ({
      id: i + 1,
      product: item.product.name,
      productCode: item.product.sku,
      quantity: item.quantity,
    })),
  };
}

export async function getReturnedMovementById(id: string): Promise<ReturnedMovementDetail | null> {
  const m = await prisma.stockMovement.findUnique({
    where: { id },
    include: {
      agent: true,
      toAgent: true,
      createdBy: true,
      items: { include: { product: true } },
    },
  });
  if (!m || m.type !== "RETURN") return null;

  const totalQty = m.items.reduce((sum, i) => sum + i.quantity, 0);

  return {
    id: m.id,
    rsId: m.referenceNumber,
    agent: m.agent?.companyName ?? "—",
    qtyReturned: totalQty,
    status: m.damaged ? "Damaged" : "Returned",
    damaged: m.damaged ?? false,
    addedBy: m.createdBy.name,
    date: formatMovementDate(m.date),
    remarks: m.remarks ?? "",
    products: m.items.map((item, i) => ({
      id: i + 1,
      product: item.product.name,
      productCode: item.product.sku,
      unit: "Unit",
      quantity: item.quantity,
    })),
  };
}

export async function getStockTransferById(id: string): Promise<StockTransferDetail | null> {
  const t = await prisma.stockTransfer.findUnique({
    where: { id },
    include: {
      createdBy: true,
      items: { include: { product: true } },
    },
  });
  if (!t) return null;

  const whIds = [
    t.sourceType === "WAREHOUSE" ? t.sourceId : null,
    t.targetType === "WAREHOUSE" ? t.targetId : null,
  ].filter(Boolean) as string[];
  const agentIds = [
    t.sourceType === "AGENT" ? t.sourceId : null,
    t.targetType === "AGENT" ? t.targetId : null,
  ].filter(Boolean) as string[];

  const [warehouses, agents] = await Promise.all([
    whIds.length > 0 ? prisma.warehouse.findMany({ where: { id: { in: whIds } }, select: { id: true, name: true } }) : [],
    agentIds.length > 0 ? prisma.agent.findMany({ where: { id: { in: agentIds } }, select: { id: true, companyName: true } }) : [],
  ]);

  const whMap = new Map(warehouses.map((w) => [w.id, w.name]));
  const agentMap = new Map(agents.map((a) => [a.id, a.companyName]));

  function resolveName(type: string, nodeId: string): string {
    if (type === "WAREHOUSE") return whMap.get(nodeId) ?? nodeId;
    return agentMap.get(nodeId) ?? nodeId;
  }

  const statusLabel: Record<string, string> = {
    DRAFT: "DRAFT", SUBMITTED: "RECORDED", COMPLETED: "RECORDED", REVERSED: "REVERSED",
  };

  return {
    id: t.id,
    transferId: t.referenceNumber,
    sourceWarehouseAgent: resolveName(t.sourceType, t.sourceId),
    targetWarehouseAgent: resolveName(t.targetType, t.targetId),
    transferReference: t.referenceNumber,
    addedBy: t.createdBy.name,
    date: formatMovementDate(t.date),
    status: statusLabel[t.status] ?? t.status,
    reversalReason: t.status === "REVERSED" ? (t.notes ?? null) : null,
    dateReversed: t.status === "REVERSED" ? formatMovementDate(t.updatedAt) : null,
    products: t.items.map((item, i) => ({
      id: i + 1,
      product: item.product.name,
      productCode: item.product.sku,
      unit: "Unit",
      quantity: item.quantity,
    })),
  };
}

// ── Stock in Warehouse (grouped by warehouse) ─────────────────────────────────

export type WarehouseStockItem = {
  productId: string;
  productName: string;
  qtyRecorded: number;
  qtyLeft: number;
};

export type WarehouseSummary = {
  id: string;
  name: string;
  managerName: string;
  totalProducts: number;
  totalQty: number;
  items: WarehouseStockItem[];
};

export async function getWarehousesWithStock(): Promise<WarehouseSummary[]> {
  const [warehouseStock, warehouses, products] = await Promise.all([
    getWarehouseStockMap(),
    prisma.warehouse.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, managerName: true },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, name: true },
    }),
  ]);

  const productNameMap = new Map(products.map((p) => [p.id, p.name]));

  return warehouses.map((w) => {
    const wMap = warehouseStock[w.id] ?? {};
    const stockItems: WarehouseStockItem[] = Object.entries(wMap)
      .map(([productId, qty]) => ({
        productId,
        productName: productNameMap.get(productId) ?? productId,
        qtyRecorded: qty,
        qtyLeft: qty,
      }))
      .filter((i) => i.qtyLeft > 0)
      .sort((a, b) => a.productName.localeCompare(b.productName));

    return {
      id: w.id,
      name: w.name,
      managerName: w.managerName ?? "—",
      totalProducts: stockItems.length,
      totalQty: stockItems.reduce((s, i) => s + i.qtyLeft, 0),
      items: stockItems,
    };
  });
}

// ── Stock Left with Agents (grouped by agent) ─────────────────────────────────

export type AgentStockItem = {
  productId: string;
  productName: string;
  qtySent: number;
  qtyLeft: number;
};

export type AgentStockSummary = {
  id: string;
  name: string;
  state: string;
  totalProducts: number;
  totalQty: number;
  items: AgentStockItem[];
};

export async function getAgentsWithStock(): Promise<AgentStockSummary[]> {
  const [agentStock, agents, products] = await Promise.all([
    getAgentStockMap(),
    prisma.agent.findMany({
      where: { deletedAt: null },
      select: { id: true, companyName: true, state: true },
      orderBy: { companyName: "asc" },
    }),
    prisma.product.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, name: true },
    }),
  ]);

  const productNameMap = new Map(products.map((p) => [p.id, p.name]));

  return agents
    .map((agent) => {
      const aMap = agentStock[agent.id] ?? {};
      const stockItems: AgentStockItem[] = Object.entries(aMap)
        .map(([productId, qty]) => ({
          productId,
          productName: productNameMap.get(productId) ?? productId,
          qtySent: qty,
          qtyLeft: qty,
        }))
        .filter((i) => i.qtyLeft > 0)
        .sort((a, b) => a.productName.localeCompare(b.productName));

      return {
        id: agent.id,
        name: agent.companyName,
        state: agent.state ?? "—",
        totalProducts: stockItems.length,
        totalQty: stockItems.reduce((s, i) => s + i.qtyLeft, 0),
        items: stockItems,
      };
    })
    .filter((a) => a.items.length > 0);
}

// ── Stock Left with Agents ────────────────────────────────────────────────────

export async function getStockLeftWithAgents(): Promise<AgentStockRow[]> {
  const [levels, agents, products] = await Promise.all([
    prisma.stockLevel.findMany({
      where: { locationKind: "AGENT", quantity: { gt: 0 } },
      select: { productId: true, locationId: true, quantity: true },
    }),
    prisma.agent.findMany({ where: { deletedAt: null }, select: { id: true, companyName: true, state: true } }),
    prisma.product.findMany({ select: { id: true, name: true } }),
  ]);

  const agentMap = new Map(agents.map((a) => [a.id, a]));
  const productNameMap = new Map(products.map((p) => [p.id, p.name]));

  let idx = 1;
  return levels.map((l) => {
    const agent = agentMap.get(l.locationId);
    // We no longer track "sent" vs "returned" separately — qtyLeft is the
    // live balance. qtySent matches it (best-effort), qtySold is derived 0.
    return {
      id: String(idx++),
      productName: productNameMap.get(l.productId) ?? l.productId,
      state: agent?.state ?? "—",
      agentName: agent?.companyName ?? "—",
      qtySent: l.quantity,
      qtySold: 0,
      qtyLeft: l.quantity,
    };
  });
}

// ── Adjustments ──────────────────────────────────────────────────────────────

export type AdjustmentRow = {
  id: string;
  referenceNumber: string;
  date: string;
  warehouse: string;
  warehouseManager: string;
  products: string;
  status: string;
  addedBy: string;
};

export type AdjustmentDetail = {
  id: string;
  saId: string;
  warehouse: string;
  warehouseManager: string;
  reason: string;
  recordedBy: string;
  date: string;
  status: string;
  notes: string;
  reversalReason: string | null;
  dateReversed: string | null;
  items: {
    id: number;
    product: string;
    productCode: string;
    quantityBefore: number;
    quantityAfter: number;
    variance: number;
  }[];
};

export async function getAdjustments(): Promise<AdjustmentRow[]> {
  const adjustments = await prisma.stockAdjustment.findMany({
    include: {
      warehouse: true,
      createdBy: true,
      items: { include: { product: true } },
    },
    orderBy: { date: "desc" },
  });

  const statusLabel: Record<string, string> = {
    DRAFT: "Draft",
    RECORDED: "Recorded",
    REVERSED: "Reversed",
  };

  return adjustments.map((a) => ({
    id: a.id,
    referenceNumber: a.referenceNumber,
    date: formatMovementDate(a.date),
    warehouse: a.warehouse.name,
    warehouseManager: a.warehouse.managerName ?? "—",
    products: a.items.map((i) => i.product.name).join(", ") || "—",
    status: statusLabel[a.status] ?? a.status,
    addedBy: a.createdBy.name,
  }));
}

export async function getAdjustmentById(id: string): Promise<AdjustmentDetail | null> {
  const a = await prisma.stockAdjustment.findUnique({
    where: { id },
    include: {
      warehouse: true,
      createdBy: true,
      items: { include: { product: true } },
    },
  });
  if (!a) return null;

  const statusLabel: Record<string, string> = {
    DRAFT: "Draft",
    RECORDED: "Recorded",
    REVERSED: "Reversed",
  };

  return {
    id: a.id,
    saId: a.referenceNumber,
    warehouse: a.warehouse.name,
    warehouseManager: a.warehouse.managerName ?? "—",
    reason: a.reason ?? "—",
    recordedBy: a.createdBy.name,
    date: formatMovementDate(a.date),
    status: statusLabel[a.status] ?? a.status,
    notes: a.notes ?? "",
    reversalReason: a.status === "REVERSED" ? (a.notes ?? null) : null,
    dateReversed: a.status === "REVERSED" ? formatMovementDate(a.updatedAt) : null,
    items: a.items.map((item, i) => ({
      id: i + 1,
      product: item.product.name,
      productCode: item.product.sku,
      quantityBefore: item.quantityBefore,
      quantityAfter: item.quantityAfter,
      variance: item.quantityAfter - item.quantityBefore,
    })),
  };
}

// ── Dropdown Helpers ──────────────────────────────────────────────────────────

export type DropdownOption = { id: string; name: string };
export type ProductDropdownOption = { id: string; name: string; sku: string };
export type TransferNodeOption = { id: string; name: string; type: "WAREHOUSE" | "AGENT" };

export async function getWarehousesForDropdown(): Promise<DropdownOption[]> {
  return prisma.warehouse.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getSuppliersForDropdown(): Promise<DropdownOption[]> {
  return prisma.supplier.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getAgentsForDropdown(): Promise<DropdownOption[]> {
  const rows = await prisma.agent.findMany({
    where: {
      deletedAt: null,
      status: "ACTIVE",
      OR: [
        { user: null },
        { user: { role: "DELIVERY_AGENT" } },
      ],
    },
    select: { id: true, companyName: true },
    orderBy: { companyName: "asc" },
  });
  return rows.map((a) => ({ id: a.id, name: a.companyName }));
}

export async function getProductsForDropdown(): Promise<ProductDropdownOption[]> {
  return prisma.product.findMany({
    where: { isActive: true, deletedAt: null },
    select: { id: true, name: true, sku: true },
    orderBy: { name: "asc" },
  });
}

export async function getTransferNodesForDropdown(): Promise<TransferNodeOption[]> {
  const warehouses = await prisma.warehouse.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return warehouses.map((w) => ({ id: w.id, name: w.name, type: "WAREHOUSE" as const }));
}

export async function getAgentProductStockMap(): Promise<Record<string, Record<string, number>>> {
  return getAgentStockMap();
}

export async function getWarehouseProductStockMap(): Promise<Record<string, Record<string, number>>> {
  return getWarehouseStockMap();
}

export async function getProductById(id: string) {
  return prisma.product.findFirst({
    where: { id, deletedAt: null },
    include: { category: true },
  });
}

export type WarehouseLocationOption = {
  id: string;
  warehouseId: string;
  locationCode: string;
  currentStock: number;
  zone: string | null;
};

export async function getAllWarehouseLocations(): Promise<WarehouseLocationOption[]> {
  return prisma.warehouseLocation.findMany({
    select: { id: true, warehouseId: true, locationCode: true, currentStock: true, zone: true },
    orderBy: [{ warehouseId: "asc" }, { locationCode: "asc" }],
  });
}

export async function getProductStockMap(): Promise<Record<string, number>> {
  return getProductTotalsMap();
}

export async function getWarehouseById(id: string) {
  return prisma.warehouse.findFirst({
    where: { id, deletedAt: null },
  });
}

export async function getSupplierById(id: string) {
  return prisma.supplier.findFirst({
    where: { id, deletedAt: null },
  });
}

export async function getCategoryById(id: string) {
  return prisma.productCategory.findFirst({
    where: { id, deletedAt: null },
  });
}
