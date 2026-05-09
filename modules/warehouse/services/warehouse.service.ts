import { prisma } from "@/lib/db/prisma";

// ── Shared form data types ────────────────────────────────────────────────────

export type FormAgent = {
  id: string;
  companyName: string;
  state: string | null;
};

export type FormProduct = {
  id: string;
  name: string;
  sku: string;
};

// Keep old aliases so outgoing pages don't need changes
export type OutgoingFormAgent = FormAgent;
export type OutgoingFormProduct = FormProduct;

export async function getAgentsForOutgoingForm(): Promise<FormAgent[]> {
  return prisma.agent.findMany({
    where: { deletedAt: null, status: "ACTIVE" },
    select: { id: true, companyName: true, state: true },
    orderBy: { companyName: "asc" },
  });
}

export async function getProductsForOutgoingForm(): Promise<FormProduct[]> {
  return prisma.product.findMany({
    where: { isActive: true, deletedAt: null },
    select: { id: true, name: true, sku: true },
    orderBy: { name: "asc" },
  });
}

// Shared helpers for returns
export const getAgentsForReturnForm = getAgentsForOutgoingForm;
export const getProductsForReturnForm = getProductsForOutgoingForm;

// ── Incoming goods ────────────────────────────────────────────────────────────

export type FormSupplier = {
  id: string;
  name: string;
};

export async function getSuppliersForIncomingForm(): Promise<FormSupplier[]> {
  return prisma.supplier.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export type IncomingGoodsRow = {
  id: string;
  date: string;
  siId: string;
  supplier: string;
  supplierRef: string;
  product: string;
  status: string;
  createdTime: string;
  addedBy: string;
};

export async function getIncomingGoodsForWarehouse(
  warehouseId: string
): Promise<IncomingGoodsRow[]> {
  const movements = await prisma.stockMovement.findMany({
    where: { type: "INCOMING", warehouseId },
    include: {
      supplier: true,
      createdBy: true,
      items: { include: { product: true } },
    },
    orderBy: { date: "desc" },
  });

  return movements.map((m) => ({
    id: m.id,
    date: formatDate(m.date),
    siId: m.referenceNumber,
    supplier: m.supplier?.name ?? "—",
    supplierRef: m.supplierReference ?? "—",
    product: m.items.map((i) => i.product.name).join(", ") || "—",
    status: m.status === "RECORDED" ? "Recorded" : m.status === "DRAFT" ? "Draft" : m.status,
    createdTime: m.createdAt
      .toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", hour12: true })
      .toLowerCase(),
    addedBy: m.createdBy.name,
  }));
}

export type IncomingGoodDetail = {
  id: string;
  siId: string;
  warehouseName: string;
  supplier: string;
  supplierRef: string;
  recordedBy: string;
  dateReceived: string;
  movementStatus: string;
  statusLabel: string;
  reversalReason: string | null;
  dateReversed: string | null;
  notes: string;
  products: { id: number; product: string; productCode: string; quantity: number }[];
};

export async function getIncomingGoodDetail(
  id: string,
  warehouseId: string
): Promise<IncomingGoodDetail | null> {
  const m = await prisma.stockMovement.findUnique({
    where: { id },
    include: {
      supplier: true,
      warehouse: true,
      createdBy: true,
      items: { include: { product: true } },
    },
  });
  if (!m || m.type !== "INCOMING" || m.warehouseId !== warehouseId) return null;

  const isReversed = m.status === "REVERSED";
  const statusLabel: Record<string, string> = {
    DRAFT: "Draft",
    RECORDED: "Recorded",
    RECEIVED: "Received",
    SHELVED: "Shelved",
    REVERSED: "Reversed",
  };

  return {
    id: m.id,
    siId: m.referenceNumber,
    warehouseName: m.warehouse?.name ?? "—",
    supplier: m.supplier?.name ?? "—",
    supplierRef: m.supplierReference ?? "—",
    recordedBy: m.createdBy.name,
    dateReceived: formatDate(m.date),
    movementStatus: m.status,
    statusLabel: statusLabel[m.status] ?? m.status,
    reversalReason: isReversed ? (m.remarks ?? null) : null,
    dateReversed: isReversed ? formatDate(m.updatedAt) : null,
    notes: m.notes ?? "",
    products: m.items.map((item, i) => ({
      id: i + 1,
      product: item.product.name,
      productCode: item.product.sku,
      quantity: item.quantity,
    })),
  };
}

// ── Returns detail ────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" });
}

export type ReturnProductRow = {
  id: number;
  product: string;
  productCode: string;
  unit: string;
  quantity: number;
};

export type WarehouseReturnDetail = {
  id: string;
  rsId: string;
  agent: string;
  state: string;
  qtyReturned: number;
  damaged: boolean;
  conditionStatus: string;
  remarks: string;
  notes: string;
  addedBy: string;
  date: string;
  movementStatus: string;
  reversalReason: string | null;
  dateReversed: string | null;
  products: ReturnProductRow[];
};

export async function getReturnMovementDetail(
  id: string
): Promise<WarehouseReturnDetail | null> {
  const m = await prisma.stockMovement.findUnique({
    where: { id },
    include: {
      agent: true,
      createdBy: true,
      items: { include: { product: true } },
    },
  });
  if (!m || m.type !== "RETURN") return null;

  const totalQty = m.items.reduce((sum, i) => sum + i.quantity, 0);
  const isReversed = m.status === "REVERSED";

  return {
    id: m.id,
    rsId: m.referenceNumber,
    agent: m.agent?.companyName ?? "—",
    state: m.state ?? m.agent?.state ?? "—",
    qtyReturned: totalQty,
    damaged: m.damaged ?? false,
    conditionStatus: m.damaged ? "Damaged" : "Good",
    remarks: m.remarks ?? "",
    notes: m.notes ?? "",
    addedBy: m.createdBy.name,
    date: formatDate(m.date),
    movementStatus: m.status,
    reversalReason: isReversed ? (m.remarks ?? null) : null,
    dateReversed: isReversed ? formatDate(m.updatedAt) : null,
    products: m.items.map((item, i) => ({
      id: i + 1,
      product: item.product.name,
      productCode: item.product.sku,
      unit: "Unit",
      quantity: item.quantity,
    })),
  };
}
