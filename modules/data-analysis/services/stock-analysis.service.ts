import { prisma } from "@/lib/db/prisma";
// Runtime import (not type-only): Prisma.DbNull is needed to filter the
// nullable rapsAssignments Json column.
import { Prisma } from "@prisma/client";
import {
  formatMovementDate,
  formatMovementTime,
  INCOMING_STATUS_LABELS,
  OUTGOING_STATUS_LABELS,
  TRANSFER_STATUS_LABELS,
  ADJUSTMENT_STATUS_LABELS,
  RAPS_STATUS_LABELS,
} from "@/modules/inventory/services/movement-format";
import { rapsTotal, parseRapsAssignments } from "@/modules/inventory/services/raps";
import {
  getProductTotalsMap,
  getWarehouseStockMap,
  getAgentStockMap,
} from "@/modules/inventory/services/stock-level.service";
import {
  getIncomingMovementById,
  getOutgoingMovementById,
  getReturnedMovementById,
  getStockTransferById,
  getAdjustmentById,
  getWarehousesForDropdown,
  getSuppliersForDropdown,
  getAgentsForDropdown,
  getProductsForDropdown,
} from "@/modules/inventory/services/inventory.service";
import type {
  IncomingMovementRow,
  OutgoingMovementRow,
  ReturnedMovementRow,
  StockTransferRow,
  AdjustmentRow,
  StockLevelRow,
  DropdownOption,
  ProductDropdownOption,
} from "@/modules/inventory/services/inventory.service";

// ─────────────────────────────────────────────────────────────────────────────
// Read-only stock reporting for the Data Analysis module.
//
// Differs from modules/inventory/services/inventory.service.ts in three ways:
//   1. every list query is filterable and paginated DB-side (the inventory
//      screens do unbounded findMany + client-side substring search);
//   2. aggregates run as Prisma aggregate/groupBy rather than JS reduce;
//   3. nothing here mutates.
//
// Domain rules this file must not violate (see docs + stock-level.service.ts):
//   • Quantities live on StockMovementItem.quantity. StockMovement.quantity and
//     .quantitySent are nullable legacy columns no read path uses.
//   • BALANCES come from StockLevel, never from summing movements. See the
//     comment on getInventorySnapshot() in finance/dashboard.service.ts —
//     movement-derived balances reported 0.
//   • REVERSED (and DRAFT) movements are excluded from every total, but still
//     appear in list rows so analysts can see them.
//   • INCOMING only counts as received at RECEIVED/SHELVED.
//   • RAPS units sit inside items.quantity but were never credited to stock, so
//     "units received" subtracts them.
// ─────────────────────────────────────────────────────────────────────────────

export const STOCK_PAGE_SIZE = 50;

/** Movement statuses that represent real, settled stock flow. */
const COUNTED_MOVEMENT_STATUSES = ["RECORDED", "RECEIVED", "QC_CHECK", "SHELVED"] as const;
/** INCOMING is only physically received at these two. */
const RECEIVED_STATUSES = ["RECEIVED", "SHELVED"] as const;

export type StockSortKey = "date" | "qty" | "status";
export type StockSortDir = "asc" | "desc";

export type StockFilters = {
  from?: Date;
  to?: Date;
  productId?: string;
  warehouseId?: string;
  agentId?: string;
  supplierId?: string;
  status?: string;
  search?: string;
  sort?: StockSortKey;
  dir?: StockSortDir;
  page?: number;
};

export type Paged<T> = {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type StockFilterOptions = {
  warehouses: DropdownOption[];
  agents: DropdownOption[];
  suppliers: DropdownOption[];
  products: ProductDropdownOption[];
  movementStatuses: DropdownOption[];
  transferStatuses: DropdownOption[];
  adjustmentStatuses: DropdownOption[];
};

// ── Filter parsing ───────────────────────────────────────────────────────────

/**
 * Parse URL searchParams into StockFilters. Filters live in the URL so they are
 * shareable and survive a refresh, and so the queries stay server-side.
 */
export function parseStockFilters(sp: Record<string, string | string[] | undefined>): StockFilters {
  const one = (k: string): string | undefined => {
    const v = sp[k];
    const s = Array.isArray(v) ? v[0] : v;
    return s && s.trim() !== "" ? s.trim() : undefined;
  };

  const parseDate = (raw: string | undefined, endOfDay: boolean): Date | undefined => {
    if (!raw) return undefined;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return undefined;
    if (endOfDay) d.setHours(23, 59, 59, 999);
    else d.setHours(0, 0, 0, 0);
    return d;
  };

  const sortRaw = one("sort");
  const dirRaw = one("dir");
  const pageRaw = Number(one("page") ?? 1);

  return {
    from: parseDate(one("from"), false),
    to: parseDate(one("to"), true),
    productId: one("productId"),
    warehouseId: one("warehouseId"),
    agentId: one("agentId"),
    supplierId: one("supplierId"),
    status: one("status"),
    search: one("q"),
    sort: sortRaw === "qty" || sortRaw === "status" ? sortRaw : "date",
    dir: dirRaw === "asc" ? "asc" : "desc",
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1,
  };
}

/** Date-window filters only — used by the overview page. */
export type StockOverviewFilters = Pick<StockFilters, "from" | "to" | "warehouseId" | "productId">;

// ── Shared where-builders ────────────────────────────────────────────────────

function dateWindow(f: StockFilters): Prisma.DateTimeFilter | undefined {
  if (!f.from && !f.to) return undefined;
  return { ...(f.from && { gte: f.from }), ...(f.to && { lte: f.to }) };
}

function movementWhere(
  type: "INCOMING" | "OUTGOING" | "RETURN",
  f: StockFilters,
): Prisma.StockMovementWhereInput {
  const date = dateWindow(f);
  const where: Prisma.StockMovementWhereInput = {
    type,
    ...(date && { date }),
    ...(f.status && { status: f.status as Prisma.EnumStockMovementStatusFilter["equals"] }),
    ...(f.warehouseId && { warehouseId: f.warehouseId }),
    ...(f.supplierId && { supplierId: f.supplierId }),
    ...(f.productId && { items: { some: { productId: f.productId } } }),
  };

  // An agent can sit on either side of an OUTGOING movement (agent→agent
  // transfers use agentId as source and toAgentId as destination).
  if (f.agentId) {
    where.OR = [{ agentId: f.agentId }, { toAgentId: f.agentId }];
  }

  if (f.search) {
    const contains = { contains: f.search, mode: "insensitive" as const };
    const searchOr: Prisma.StockMovementWhereInput[] = [
      { referenceNumber: contains },
      { supplierReference: contains },
      { state: contains },
      { remarks: contains },
      { supplier: { name: contains } },
      { warehouse: { name: contains } },
      { agent: { companyName: contains } },
      { toAgent: { companyName: contains } },
      { items: { some: { product: { name: contains } } } },
    ];
    // Combine with the agent OR (if any) via AND so both must hold.
    if (where.OR) {
      where.AND = [{ OR: where.OR }, { OR: searchOr }];
      delete where.OR;
    } else {
      where.OR = searchOr;
    }
  }

  return where;
}

function movementOrderBy(f: StockFilters): Prisma.StockMovementOrderByWithRelationInput[] {
  const dir = f.dir ?? "desc";
  if (f.sort === "status") return [{ status: dir }, { date: "desc" }];
  // "qty" lives on the child rows, so it can't be an orderBy — the list
  // services sort those pages in memory after mapping (see sortRowsByQty).
  return [{ date: dir }, { createdAt: dir }];
}

function paged<T>(rows: T[], total: number, f: StockFilters): Paged<T> {
  const page = f.page ?? 1;
  return {
    rows,
    total,
    page,
    pageSize: STOCK_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / STOCK_PAGE_SIZE)),
  };
}

function skipTake(f: StockFilters) {
  return { skip: ((f.page ?? 1) - 1) * STOCK_PAGE_SIZE, take: STOCK_PAGE_SIZE };
}

/**
 * Quantity sorting can't be pushed to the DB (it's a sum over child rows), so
 * it's applied to the current page after mapping. Documented so nobody reads
 * the numbers as a global ranking — that's what the overview's top-movers is.
 */
function sortRowsByQty<T>(rows: T[], f: StockFilters, qty: (r: T) => number): T[] {
  if (f.sort !== "qty") return rows;
  const mul = f.dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => (qty(a) - qty(b)) * mul);
}

// ── Incoming ─────────────────────────────────────────────────────────────────

export async function getIncomingMovementsFiltered(
  f: StockFilters,
): Promise<Paged<IncomingMovementRow>> {
  const where = movementWhere("INCOMING", f);

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: {
        supplier: { select: { name: true } },
        warehouse: { select: { name: true } },
        createdBy: { select: { name: true } },
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: movementOrderBy(f),
      ...skipTake(f),
    }),
    prisma.stockMovement.count({ where }),
  ]);

  const rows: IncomingMovementRow[] = movements.map((m) => ({
    id: m.id,
    date: formatMovementDate(m.date),
    siId: m.referenceNumber,
    supplier: m.supplier?.name ?? "—",
    warehouse: m.warehouse?.name ?? "—",
    supplierRef: m.supplierReference ?? "—",
    product: m.items.map((i) => i.product.name).join(", ") || "—",
    status: INCOMING_STATUS_LABELS[m.status] ?? m.status,
    createdTime: formatMovementTime(m.createdAt),
    addedBy: m.createdBy.name,
    rapsApprovalStatus: m.rapsApprovalStatus,
    rapsQuantity: rapsTotal(m.rapsAssignments),
  }));

  const qtyOf = (m: (typeof movements)[number]) => m.items.reduce((s, i) => s + i.quantity, 0);
  const byId = new Map(movements.map((m) => [m.id, qtyOf(m)]));

  return paged(sortRowsByQty(rows, f, (r) => byId.get(r.id) ?? 0), total, f);
}

// ── Outgoing ─────────────────────────────────────────────────────────────────

export async function getOutgoingMovementsFiltered(
  f: StockFilters,
): Promise<Paged<OutgoingMovementRow>> {
  const where = movementWhere("OUTGOING", f);

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: {
        agent: { select: { companyName: true, phone1: true } },
        toAgent: { select: { companyName: true, phone1: true } },
        createdBy: { select: { name: true } },
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: movementOrderBy(f),
      ...skipTake(f),
    }),
    prisma.stockMovement.count({ where }),
  ]);

  const rows: OutgoingMovementRow[] = movements.map((m) => ({
    id: m.id,
    date: formatMovementDate(m.date),
    productName: m.items.map((i) => i.product.name).join(", ") || "—",
    state: m.state ?? "—",
    agent: m.isAgentToAgentTransfer
      ? `${m.agent?.companyName ?? "Unknown"} → ${m.toAgent?.companyName ?? "Unknown"}`
      : (m.toAgent?.companyName ?? m.agent?.companyName ?? "—"),
    otherInfo: m.toAgent?.phone1 ?? m.agent?.phone1 ?? "—",
    qtySent: m.items.reduce((s, i) => s + i.quantity, 0),
    status: OUTGOING_STATUS_LABELS[m.status] ?? m.status,
    addedBy: m.createdBy.name,
  }));

  return paged(sortRowsByQty(rows, f, (r) => r.qtySent), total, f);
}

// ── Returned ─────────────────────────────────────────────────────────────────

export async function getReturnedMovementsFiltered(
  f: StockFilters,
): Promise<Paged<ReturnedMovementRow>> {
  const where = movementWhere("RETURN", f);

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: {
        agent: { select: { companyName: true } },
        warehouse: { select: { name: true } },
        createdBy: { select: { name: true } },
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: movementOrderBy(f),
      ...skipTake(f),
    }),
    prisma.stockMovement.count({ where }),
  ]);

  const rows: ReturnedMovementRow[] = movements.map((m) => ({
    id: m.id,
    date: formatMovementDate(m.date),
    productName: m.items.map((i) => i.product.name).join(", ") || "—",
    state: m.state ?? "—",
    agent: m.agent?.companyName ?? "—",
    qtyReturned: m.items.reduce((s, i) => s + i.quantity, 0),
    damaged: m.damaged ? "Yes" : "No",
    remarks: m.remarks ?? "—",
    warehouse: m.warehouse?.name ?? "—",
    addedBy: m.createdBy.name,
  }));

  return paged(sortRowsByQty(rows, f, (r) => r.qtyReturned), total, f);
}

// ── Transfers ────────────────────────────────────────────────────────────────

export async function getStockTransfersFiltered(f: StockFilters): Promise<Paged<StockTransferRow>> {
  const date = dateWindow(f);

  // sourceId/targetId are polymorphic strings with no FK, so a warehouse or
  // agent filter matches either side by raw id.
  const nodeId = f.warehouseId ?? f.agentId;
  const where: Prisma.StockTransferWhereInput = {
    ...(date && { date }),
    ...(f.status && { status: f.status as Prisma.EnumStockTransferStatusFilter["equals"] }),
    ...(f.productId && { items: { some: { productId: f.productId } } }),
    ...(nodeId && { OR: [{ sourceId: nodeId }, { targetId: nodeId }] }),
  };

  if (f.search) {
    const contains = { contains: f.search, mode: "insensitive" as const };
    const searchOr: Prisma.StockTransferWhereInput[] = [
      { referenceNumber: contains },
      { notes: contains },
      { items: { some: { product: { name: contains } } } },
    ];
    if (where.OR) {
      where.AND = [{ OR: where.OR }, { OR: searchOr }];
      delete where.OR;
    } else {
      where.OR = searchOr;
    }
  }

  const [transfers, total] = await Promise.all([
    prisma.stockTransfer.findMany({
      where,
      include: {
        createdBy: { select: { name: true } },
        items: { select: { quantity: true } },
      },
      orderBy:
        f.sort === "status"
          ? [{ status: f.dir ?? "desc" }, { date: "desc" }]
          : [{ date: f.dir ?? "desc" }],
      ...skipTake(f),
    }),
    prisma.stockTransfer.count({ where }),
  ]);

  const names = await resolveTransferNodeNames(transfers);

  const rows: StockTransferRow[] = transfers.map((t) => ({
    id: t.id,
    transferId: t.referenceNumber,
    date: formatMovementDate(t.date),
    from: names.name(t.sourceType, t.sourceId),
    to: names.name(t.targetType, t.targetId),
    warehouseManager: names.manager(t.sourceType, t.sourceId),
    items: t.items.length,
    totalQty: t.items.reduce((s, i) => s + i.quantity, 0),
    status: TRANSFER_STATUS_LABELS[t.status] ?? t.status,
    addedBy: t.createdBy.name,
  }));

  return paged(sortRowsByQty(rows, f, (r) => r.totalQty), total, f);
}

/**
 * StockTransfer.sourceId/targetId are polymorphic strings with no FK (the
 * Prisma idiom for polymorphism used across this schema), so display names need
 * a follow-up lookup — same approach as inventory.service.getStockTransfers().
 */
async function resolveTransferNodeNames(
  transfers: { sourceType: string; sourceId: string; targetType: string; targetId: string }[],
) {
  const pick = (kind: string) =>
    transfers
      .flatMap((t) => [
        t.sourceType === kind ? t.sourceId : null,
        t.targetType === kind ? t.targetId : null,
      ])
      .filter((v): v is string => Boolean(v));

  const whIds = pick("WAREHOUSE");
  const agentIds = pick("AGENT");

  const [warehouses, agents] = await Promise.all([
    whIds.length
      ? prisma.warehouse.findMany({
          where: { id: { in: whIds } },
          select: { id: true, name: true, managerName: true },
        })
      : [],
    agentIds.length
      ? prisma.agent.findMany({
          where: { id: { in: agentIds } },
          select: { id: true, companyName: true },
        })
      : [],
  ]);

  const whMap = new Map(warehouses.map((w) => [w.id, w]));
  const agentMap = new Map(agents.map((a) => [a.id, a]));

  return {
    name(type: string, id: string): string {
      if (type === "WAREHOUSE") return whMap.get(id)?.name ?? id;
      return agentMap.get(id)?.companyName ?? id;
    },
    manager(type: string, id: string): string {
      if (type === "WAREHOUSE") return whMap.get(id)?.managerName ?? "—";
      return agentMap.get(id)?.companyName ?? "—";
    },
  };
}

// ── Adjustments ──────────────────────────────────────────────────────────────

export async function getAdjustmentsFiltered(f: StockFilters): Promise<Paged<AdjustmentRow>> {
  const date = dateWindow(f);
  const where: Prisma.StockAdjustmentWhereInput = {
    ...(date && { date }),
    ...(f.status && { status: f.status as Prisma.EnumStockAdjustmentStatusFilter["equals"] }),
    ...(f.warehouseId && { warehouseId: f.warehouseId }),
    ...(f.productId && { items: { some: { productId: f.productId } } }),
    ...(f.search && {
      OR: [
        { referenceNumber: { contains: f.search, mode: "insensitive" } },
        { reason: { contains: f.search, mode: "insensitive" } },
        { warehouse: { name: { contains: f.search, mode: "insensitive" } } },
        { items: { some: { product: { name: { contains: f.search, mode: "insensitive" } } } } },
      ],
    }),
  };

  const [adjustments, total] = await Promise.all([
    prisma.stockAdjustment.findMany({
      where,
      include: {
        warehouse: { select: { name: true, managerName: true } },
        createdBy: { select: { name: true } },
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy:
        f.sort === "status"
          ? [{ status: f.dir ?? "desc" }, { date: "desc" }]
          : [{ date: f.dir ?? "desc" }],
      ...skipTake(f),
    }),
    prisma.stockAdjustment.count({ where }),
  ]);

  const rows: AdjustmentRow[] = adjustments.map((a) => ({
    id: a.id,
    referenceNumber: a.referenceNumber,
    date: formatMovementDate(a.date),
    warehouse: a.warehouse.name,
    warehouseManager: a.warehouse.managerName ?? "—",
    products: a.items.map((i) => i.product.name).join(", ") || "—",
    status: ADJUSTMENT_STATUS_LABELS[a.status] ?? a.status,
    addedBy: a.createdBy.name,
  }));

  return paged(rows, total, f);
}

// ── Overview ─────────────────────────────────────────────────────────────────

export type StockTrendPoint = {
  name: string;
  received: number;
  dispatched: number;
  returned: number;
};

export type TopMoverRow = {
  productId: string;
  product: string;
  sku: string;
  received: number;
  dispatched: number;
  returned: number;
  net: number;
};

export type StockOverview = {
  /** Balances — sourced from StockLevel, never from movement sums. */
  balances: {
    totalStock: number;
    warehouseStock: number;
    agentStock: number;
    unassignedStock: number;
    activeSkus: number;
    lowStockCount: number;
    warehouseCount: number;
    agentCount: number;
  };
  /** Flows within the selected window, excluding DRAFT/REVERSED. */
  flows: {
    unitsReceived: number;
    rapsWithheld: number;
    unitsDispatched: number;
    unitsReturned: number;
    net: number;
    incomingCount: number;
    outgoingCount: number;
    returnCount: number;
    transferCount: number;
    adjustmentCount: number;
  };
  health: {
    pendingRaps: number;
    reversedInPeriod: number;
    openDamageReports: number;
    pendingAdjustments: number;
  };
  trend: StockTrendPoint[];
  trendBucket: "day" | "week" | "month";
  topMovers: TopMoverRow[];
  lowStock: StockLevelRow[];
  rangeLabel: string;
};

/** Default reporting window when the URL carries no dates: last 30 days. */
export function defaultStockWindow(): { from: Date; to: Date } {
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  const from = new Date(to);
  from.setDate(from.getDate() - 29);
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

export async function getStockOverview(f: StockOverviewFilters): Promise<StockOverview> {
  const fallback = defaultStockWindow();
  const from = f.from ?? fallback.from;
  const to = f.to ?? fallback.to;

  // Scope shared by every flow query in this function.
  const scope: Prisma.StockMovementWhereInput = {
    date: { gte: from, lte: to },
    ...(f.warehouseId && { warehouseId: f.warehouseId }),
    ...(f.productId && { items: { some: { productId: f.productId } } }),
  };
  const counted = { ...scope, status: { in: [...COUNTED_MOVEMENT_STATUSES] } };

  const itemScope = (
    type: "INCOMING" | "OUTGOING" | "RETURN",
    statuses: readonly string[],
  ): Prisma.StockMovementItemWhereInput => ({
    ...(f.productId && { productId: f.productId }),
    stockMovement: {
      type,
      date: { gte: from, lte: to },
      status: { in: statuses as Prisma.EnumStockMovementStatusFilter["in"] },
      ...(f.warehouseId && { warehouseId: f.warehouseId }),
    },
  });

  const [
    products,
    totalsMap,
    warehouseMap,
    agentMap,
    unassignedLevels,
    receivedAgg,
    dispatchedAgg,
    returnedAgg,
    incomingCount,
    outgoingCount,
    returnCount,
    transferCount,
    adjustmentCount,
    pendingRaps,
    reversedInPeriod,
    openDamageReports,
    pendingAdjustments,
    rapsMovements,
    trendMovements,
    topMoverGroups,
  ] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, name: true, sku: true, lowStockAlertQtyTotal: true, category: { select: { categoryName: true } } },
    }),
    getProductTotalsMap(),
    getWarehouseStockMap(),
    getAgentStockMap(),
    prisma.stockLevel.findMany({
      where: { locationKind: "UNASSIGNED" },
      select: { quantity: true },
    }),

    // INCOMING only counts as physically received at RECEIVED/SHELVED.
    prisma.stockMovementItem.aggregate({
      where: itemScope("INCOMING", RECEIVED_STATUSES),
      _sum: { quantity: true },
    }),
    prisma.stockMovementItem.aggregate({
      where: itemScope("OUTGOING", COUNTED_MOVEMENT_STATUSES),
      _sum: { quantity: true },
    }),
    prisma.stockMovementItem.aggregate({
      where: itemScope("RETURN", COUNTED_MOVEMENT_STATUSES),
      _sum: { quantity: true },
    }),

    prisma.stockMovement.count({ where: { ...counted, type: "INCOMING" } }),
    prisma.stockMovement.count({ where: { ...counted, type: "OUTGOING" } }),
    prisma.stockMovement.count({ where: { ...counted, type: "RETURN" } }),
    prisma.stockTransfer.count({
      where: {
        date: { gte: from, lte: to },
        status: { notIn: ["DRAFT", "REVERSED"] },
        ...(f.productId && { items: { some: { productId: f.productId } } }),
      },
    }),
    prisma.stockAdjustment.count({
      where: {
        date: { gte: from, lte: to },
        status: "RECORDED",
        ...(f.warehouseId && { warehouseId: f.warehouseId }),
        ...(f.productId && { items: { some: { productId: f.productId } } }),
      },
    }),

    prisma.stockMovement.count({ where: { ...scope, rapsApprovalStatus: "PENDING_APPROVAL" } }),
    prisma.stockMovement.count({ where: { ...scope, status: "REVERSED" } }),
    prisma.damageReport.count({
      where: {
        status: "OPEN",
        ...(f.warehouseId && { warehouseLocation: { warehouseId: f.warehouseId } }),
      },
    }),
    prisma.stockAdjustment.count({
      where: {
        status: "PENDING_APPROVAL",
        ...(f.warehouseId && { warehouseId: f.warehouseId }),
      },
    }),

    // RAPS units are inside the received sum above but were never credited to
    // stock, so they have to be subtracted back out.
    prisma.stockMovement.findMany({
      where: {
        ...scope,
        type: "INCOMING",
        status: { in: [...RECEIVED_STATUSES] },
        rapsAssignments: { not: Prisma.DbNull },
      },
      select: { rapsAssignments: true },
    }),

    // Trend series. Only date + type + item quantities are needed, so this
    // stays a narrow select even over a long window.
    prisma.stockMovement.findMany({
      where: counted,
      select: {
        date: true,
        type: true,
        items: {
          where: f.productId ? { productId: f.productId } : undefined,
          select: { quantity: true },
        },
      },
    }),

    prisma.stockMovementItem.groupBy({
      by: ["productId"],
      where: {
        ...(f.productId && { productId: f.productId }),
        stockMovement: {
          date: { gte: from, lte: to },
          status: { in: [...COUNTED_MOVEMENT_STATUSES] },
          ...(f.warehouseId && { warehouseId: f.warehouseId }),
        },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 8,
    }),
  ]);

  // ── Balances (StockLevel-derived) ──
  const warehouseStock = Object.values(warehouseMap).reduce(
    (s, byProduct) => s + Object.values(byProduct).reduce((a, q) => a + q, 0),
    0,
  );
  const agentStock = Object.values(agentMap).reduce(
    (s, byProduct) => s + Object.values(byProduct).reduce((a, q) => a + q, 0),
    0,
  );
  const unassignedStock = unassignedLevels.reduce((s, l) => s + l.quantity, 0);

  const lowStock: StockLevelRow[] = products
    .map((p) => {
      const qty = totalsMap[p.id] ?? 0;
      const min = p.lowStockAlertQtyTotal ?? 50;
      const status: "OK" | "Low" | "Watch" = qty < min ? "Low" : qty < min * 1.5 ? "Watch" : "OK";
      return {
        id: p.id,
        sku: p.sku,
        category: p.category.categoryName,
        product: p.name,
        qty,
        min,
        status,
      };
    })
    .filter((r) => r.status !== "OK")
    .sort((a, b) => a.qty / a.min - b.qty / b.min);

  // ── Flows ──
  const rapsWithheld = rapsMovements.reduce((s, m) => s + rapsTotal(m.rapsAssignments), 0);
  const grossReceived = receivedAgg._sum.quantity ?? 0;
  const unitsReceived = Math.max(0, grossReceived - rapsWithheld);
  const unitsDispatched = dispatchedAgg._sum.quantity ?? 0;
  const unitsReturned = returnedAgg._sum.quantity ?? 0;

  // ── Trend ──
  const spanDays = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1);
  const trendBucket: "day" | "week" | "month" =
    spanDays <= 31 ? "day" : spanDays <= 182 ? "week" : "month";
  const trend = buildTrend(trendMovements, from, to, trendBucket);

  // ── Top movers ──
  const productById = new Map(products.map((p) => [p.id, p]));
  const moverIds = topMoverGroups.map((g) => g.productId);
  const perTypeSums = moverIds.length
    ? await prisma.stockMovementItem.groupBy({
        by: ["productId"],
        where: {
          productId: { in: moverIds },
          stockMovement: {
            type: "OUTGOING",
            date: { gte: from, lte: to },
            status: { in: [...COUNTED_MOVEMENT_STATUSES] },
            ...(f.warehouseId && { warehouseId: f.warehouseId }),
          },
        },
        _sum: { quantity: true },
      })
    : [];
  const outByProduct = new Map(perTypeSums.map((g) => [g.productId, g._sum.quantity ?? 0]));

  const topMovers: TopMoverRow[] = topMoverGroups.map((g) => {
    const p = productById.get(g.productId);
    const total = g._sum.quantity ?? 0;
    const dispatched = outByProduct.get(g.productId) ?? 0;
    return {
      productId: g.productId,
      product: p?.name ?? g.productId,
      sku: p?.sku ?? "—",
      received: Math.max(0, total - dispatched),
      dispatched,
      returned: 0,
      net: total,
    };
  });

  return {
    balances: {
      totalStock: Object.values(totalsMap).reduce((s, q) => s + q, 0),
      warehouseStock,
      agentStock,
      unassignedStock,
      activeSkus: products.length,
      lowStockCount: lowStock.filter((r) => r.status === "Low").length,
      warehouseCount: Object.keys(warehouseMap).length,
      agentCount: Object.keys(agentMap).length,
    },
    flows: {
      unitsReceived,
      rapsWithheld,
      unitsDispatched,
      unitsReturned,
      net: unitsReceived + unitsReturned - unitsDispatched,
      incomingCount,
      outgoingCount,
      returnCount,
      transferCount,
      adjustmentCount,
    },
    health: { pendingRaps, reversedInPeriod, openDamageReports, pendingAdjustments },
    trend,
    trendBucket,
    topMovers,
    lowStock: lowStock.slice(0, 8),
    rangeLabel: `${formatMovementDate(from)} — ${formatMovementDate(to)}`,
  };
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function bucketKey(d: Date, bucket: "day" | "week" | "month"): string {
  const x = new Date(d);
  if (bucket === "month") return `${x.getFullYear()}-${x.getMonth()}`;
  if (bucket === "week") {
    x.setHours(0, 0, 0, 0);
    x.setDate(x.getDate() - x.getDay()); // week starts Sunday
    return x.toDateString();
  }
  x.setHours(0, 0, 0, 0);
  return x.toDateString();
}

function bucketLabel(d: Date, bucket: "day" | "week" | "month"): string {
  if (bucket === "month") return MONTH_LABELS[d.getMonth()];
  if (bucket === "week") return `${d.getDate()} ${MONTH_LABELS[d.getMonth()]}`;
  return `${DAY_LABELS[d.getDay()]} ${d.getDate()}`;
}

/**
 * Bucket movements into a dense series so the chart shows empty periods as
 * zero-height bars rather than silently collapsing the x-axis.
 */
function buildTrend(
  movements: { date: Date; type: string; items: { quantity: number }[] }[],
  from: Date,
  to: Date,
  bucket: "day" | "week" | "month",
): StockTrendPoint[] {
  const series = new Map<string, StockTrendPoint>();

  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  if (bucket === "week") cursor.setDate(cursor.getDate() - cursor.getDay());
  if (bucket === "month") cursor.setDate(1);

  while (cursor <= to) {
    series.set(bucketKey(cursor, bucket), {
      name: bucketLabel(cursor, bucket),
      received: 0,
      dispatched: 0,
      returned: 0,
    });
    if (bucket === "day") cursor.setDate(cursor.getDate() + 1);
    else if (bucket === "week") cursor.setDate(cursor.getDate() + 7);
    else cursor.setMonth(cursor.getMonth() + 1);
  }

  for (const m of movements) {
    const entry = series.get(bucketKey(m.date, bucket));
    if (!entry) continue;
    const qty = m.items.reduce((s, i) => s + i.quantity, 0);
    if (m.type === "INCOMING") entry.received += qty;
    else if (m.type === "OUTGOING") entry.dispatched += qty;
    else if (m.type === "RETURN") entry.returned += qty;
  }

  return Array.from(series.values());
}

// ── Detail (normalized across all five record kinds) ─────────────────────────

export type StockRecordKind = "incoming" | "outgoing" | "returned" | "transfer" | "adjustment";

export type StockDetailField = { label: string; value: string };

export type StockDetailItem = {
  index: number;
  product: string;
  productCode: string;
  quantity: string;
  extra?: string;
};

export type StockDetailView = {
  kind: StockRecordKind;
  id: string;
  reference: string;
  title: string;
  status: string;
  fields: StockDetailField[];
  itemColumns: string[];
  items: StockDetailItem[];
  totalQuantity: number | null;
  reversalReason: string | null;
  dateReversed: string | null;
  raps: {
    statusLabel: string | null;
    rejectionReason: string | null;
    items: { product: string; productCode: string; quantity: number }[];
    withheldTotal: number;
  } | null;
  attachments: string[];
  backHref: string;
};

const KIND_META: Record<StockRecordKind, { title: string; backHref: string }> = {
  incoming: { title: "Incoming Stock", backHref: "/data/stock/incoming" },
  outgoing: { title: "Outgoing Stock", backHref: "/data/stock/outgoing" },
  returned: { title: "Returned Stock", backHref: "/data/stock/returned" },
  transfer: { title: "Stock Transfer", backHref: "/data/stock/transfer" },
  adjustment: { title: "Stock Adjustment", backHref: "/data/stock/adjustment" },
};

/**
 * Normalize the five differently-shaped detail records into one read-only view
 * model, so a single client component can render them all. Reuses the existing
 * inventory detail fetchers rather than re-querying.
 */
export async function getStockMovementDetail(
  kind: StockRecordKind,
  id: string,
): Promise<StockDetailView | null> {
  const meta = KIND_META[kind];
  const base = { kind, id, title: meta.title, backHref: meta.backHref, attachments: [] as string[] };

  if (kind === "incoming") {
    const d = await getIncomingMovementById(id);
    if (!d) return null;
    return {
      ...base,
      reference: d.siId,
      status: d.status,
      fields: [
        { label: "Supplier", value: d.supplier },
        { label: "Warehouse", value: d.warehouse },
        { label: "Supplier Ref.", value: d.supplierRef },
        { label: "Date Received", value: d.dateReceived },
        { label: "Recorded By", value: d.recordedBy },
      ],
      itemColumns: ["#", "Product", "Product Code", "Quantity"],
      items: d.products.map((p) => ({
        index: p.id,
        product: p.product,
        productCode: p.productCode,
        quantity: p.quantity.toLocaleString(),
      })),
      totalQuantity: d.products.reduce((s, p) => s + p.quantity, 0),
      reversalReason: d.reversalReason,
      dateReversed: d.dateReversed,
      raps: {
        statusLabel: d.rapsApprovalStatusLabel,
        rejectionReason: d.rapsRejectionReason,
        items: d.rapsItems,
        withheldTotal: d.rapsItems.reduce((s, r) => s + r.quantity, 0),
      },
      attachments: d.supplierInvoiceUrls,
    };
  }

  if (kind === "outgoing") {
    const d = await getOutgoingMovementById(id);
    if (!d) return null;
    return {
      ...base,
      reference: d.soId,
      status: d.status,
      fields: [
        { label: "Agent", value: d.agent },
        { label: "State", value: d.state },
        { label: "Country", value: d.country },
        { label: "Reference", value: d.supplierReference },
        { label: "Date", value: d.date },
        { label: "Added By", value: d.addedBy },
      ],
      itemColumns: ["#", "Product", "Product Code", "Qty Sent"],
      items: d.products.map((p) => ({
        index: p.id,
        product: p.product,
        productCode: p.productCode,
        quantity: p.quantity.toLocaleString(),
      })),
      totalQuantity: d.products.reduce((s, p) => s + p.quantity, 0),
      reversalReason: d.reversalReason,
      dateReversed: d.dateReversed,
      raps: null,
    };
  }

  if (kind === "returned") {
    const d = await getReturnedMovementById(id);
    if (!d) return null;
    return {
      ...base,
      reference: d.rsId,
      status: d.status,
      fields: [
        { label: "Agent", value: d.agent },
        { label: "Qty Returned", value: d.qtyReturned.toLocaleString() },
        { label: "Damaged", value: d.damaged ? "Yes" : "No" },
        { label: "Date", value: d.date },
        { label: "Added By", value: d.addedBy },
        { label: "Remarks", value: d.remarks || "—" },
      ],
      itemColumns: ["#", "Product", "Product Code", "Unit", "Qty Returned"],
      items: d.products.map((p) => ({
        index: p.id,
        product: p.product,
        productCode: p.productCode,
        quantity: p.quantity.toLocaleString(),
        extra: p.unit,
      })),
      totalQuantity: d.qtyReturned,
      reversalReason: null,
      dateReversed: null,
      raps: null,
    };
  }

  if (kind === "transfer") {
    const d = await getStockTransferById(id);
    if (!d) return null;
    return {
      ...base,
      reference: d.transferId,
      status: d.status,
      fields: [
        { label: "From", value: d.sourceWarehouseAgent },
        { label: "To", value: d.targetWarehouseAgent },
        { label: "Reference", value: d.transferReference },
        { label: "Date", value: d.date },
        { label: "Added By", value: d.addedBy },
      ],
      itemColumns: ["#", "Product", "Product Code", "Unit", "Quantity"],
      items: d.products.map((p) => ({
        index: p.id,
        product: p.product,
        productCode: p.productCode,
        quantity: p.quantity.toLocaleString(),
        extra: p.unit,
      })),
      totalQuantity: d.products.reduce((s, p) => s + p.quantity, 0),
      reversalReason: d.reversalReason,
      dateReversed: d.dateReversed,
      raps: null,
    };
  }

  const d = await getAdjustmentById(id);
  if (!d) return null;
  return {
    ...base,
    reference: d.saId,
    status: d.status,
    fields: [
      { label: "Warehouse", value: d.warehouse },
      { label: "Warehouse Manager", value: d.warehouseManager },
      { label: "Reason", value: d.reason },
      { label: "Date", value: d.date },
      { label: "Recorded By", value: d.recordedBy },
      { label: "Notes", value: d.notes || "—" },
    ],
    itemColumns: ["#", "Product", "Product Code", "Qty Before", "Qty After", "Variance"],
    items: d.items.map((i) => ({
      index: i.id,
      product: i.product,
      productCode: i.productCode,
      quantity: `${i.quantityBefore.toLocaleString()} → ${i.quantityAfter.toLocaleString()}`,
      extra: `${i.variance > 0 ? "+" : ""}${i.variance.toLocaleString()}`,
    })),
    totalQuantity: null,
    reversalReason: d.reversalReason,
    dateReversed: d.dateReversed,
    raps: null,
  };
}

// ── Filter options ───────────────────────────────────────────────────────────

const asOptions = (labels: Record<string, string>): DropdownOption[] =>
  Object.entries(labels).map(([id, name]) => ({ id, name }));

export async function getStockFilterOptions(): Promise<StockFilterOptions> {
  const [warehouses, agents, suppliers, products] = await Promise.all([
    getWarehousesForDropdown(),
    getAgentsForDropdown(),
    getSuppliersForDropdown(),
    getProductsForDropdown(),
  ]);

  return {
    warehouses,
    agents,
    suppliers,
    products,
    movementStatuses: asOptions(INCOMING_STATUS_LABELS),
    transferStatuses: asOptions(TRANSFER_STATUS_LABELS),
    adjustmentStatuses: asOptions(ADJUSTMENT_STATUS_LABELS),
  };
}

// Re-exported so pages can label RAPS badges without importing from the
// inventory module directly.
export { RAPS_STATUS_LABELS, parseRapsAssignments };

// ── Balances by location (reused wholesale from the inventory module) ─────────
export {
  getWarehousesWithStock,
  getAgentsWithStock,
} from "@/modules/inventory/services/inventory.service";
export type {
  WarehouseSummary,
  AgentStockSummary,
  WarehouseStockItem,
  AgentStockItem,
} from "@/modules/inventory/services/inventory.service";
