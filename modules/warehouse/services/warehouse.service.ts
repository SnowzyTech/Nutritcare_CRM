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

// ── Recorded inventory vouchers for warehouse receipt confirmation ─────────────

export type RecordedVoucherItem = {
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
};

export type RecordedVoucher = {
  id: string;
  referenceNumber: string;
  warehouseName: string;
  supplierId: string | null;
  supplierName: string | null;
  supplierReference: string | null;
  items: RecordedVoucherItem[];
};

export async function getRecordedIncomingVouchers(
  warehouseId: string
): Promise<RecordedVoucher[]> {
  const movements = await prisma.stockMovement.findMany({
    where: { type: "INCOMING", status: "RECORDED", warehouseId },
    include: {
      warehouse: { select: { name: true } },
      supplier: { select: { id: true, name: true } },
      items: { include: { product: { select: { id: true, name: true, sku: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return movements.map((m) => ({
    id: m.id,
    referenceNumber: m.referenceNumber,
    warehouseName: m.warehouse?.name ?? "—",
    supplierId: m.supplier?.id ?? null,
    supplierName: m.supplier?.name ?? null,
    supplierReference: m.supplierReference ?? null,
    items: m.items.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      productCode: item.product.sku,
      quantity: item.quantity,
    })),
  }));
}

// ── Pick & Pack ───────────────────────────────────────────────────────────────

export type PickPackRow = {
  // PickPack.id — the row identifier, passed directly to assignPickerAction
  id: string;
  referenceNumber: string;
  dispatchAgent: string;
  itemsCount: number;
  picker: string;
  pickerId: string | null;
  locationCode: string;
  assignedAt: string | null;
  status: "QUEUED" | "PACKED";
};

export async function getPickPackOrders(warehouseId: string | null): Promise<PickPackRow[]> {
  const pickPacks = await prisma.pickPack.findMany({
    where: {
      status: { in: ["QUEUED", "PACKED"] },
      OR: [
        {
          stockMovementId: { not: null },
          ...(warehouseId ? { stockMovement: { warehouseId } } : {}),
        },
        {
          stockTransferId: { not: null },
          ...(warehouseId
            ? { stockTransfer: { sourceType: "WAREHOUSE", sourceId: warehouseId } }
            : {}),
        },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      stockMovement: {
        select: {
          referenceNumber: true,
          driverAgent: { select: { companyName: true } },
        },
      },
      stockTransfer: {
        select: {
          referenceNumber: true,
          driverAgent: { select: { companyName: true } },
        },
      },
      picker: { select: { name: true } },
    },
  });

  return pickPacks.map((pp) => ({
    id: pp.id,
    referenceNumber:
      pp.stockMovement?.referenceNumber ?? pp.stockTransfer?.referenceNumber ?? "—",
    dispatchAgent:
      pp.stockMovement?.driverAgent?.companyName ??
      pp.stockTransfer?.driverAgent?.companyName ??
      "—",
    itemsCount: pp.itemsCount,
    picker: pp.picker?.name ?? "—",
    pickerId: pp.pickerId,
    locationCode: pp.locationCode || "—",
    assignedAt: pp.assignedAt
      ? pp.assignedAt
          .toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", hour12: true })
          .toLowerCase()
      : null,
    status: pp.status as "QUEUED" | "PACKED",
  }));
}

export type PickerOption = {
  id: string;
  name: string;
  activeTasks: number;
};

export async function getAvailablePickers(): Promise<PickerOption[]> {
  const [pickers, activeCounts] = await Promise.all([
    prisma.user.findMany({
      where: { isActive: true, role: "WAREHOUSE_MANAGER" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.pickPack.groupBy({
      by: ["pickerId"],
      where: { status: "PACKED", pickerId: { not: null } },
      _count: { id: true },
    }),
  ]);

  const taskMap = new Map(activeCounts.map((t) => [t.pickerId as string, t._count.id]));

  return pickers.map((p) => ({
    id: p.id,
    name: p.name,
    activeTasks: taskMap.get(p.id) ?? 0,
  }));
}

// ── Warehouse Locations ───────────────────────────────────────────────────────

export type LocationBinRow = {
  id: string;
  locationCode: string;
  zone: string;
  col: string;
  occupancyStatus: string;
  currentStock: number;
  maxCapacity: number | null;
};

export async function getWarehouseLocations(warehouseId: string): Promise<LocationBinRow[]> {
  const locations = await prisma.warehouseLocation.findMany({
    where: { warehouseId },
    orderBy: [{ zone: "asc" }, { locationCode: "asc" }],
  });

  return locations.map((l) => {
    const zone = l.zone ?? l.locationCode.charAt(0);
    const col = l.locationCode.slice(zone.length);
    return {
      id: l.id,
      locationCode: l.locationCode,
      zone,
      col,
      occupancyStatus: l.occupancyStatus,
      currentStock: l.currentStock,
      maxCapacity: l.maxCapacity ?? null,
    };
  });
}

export type LocationSummaryRow = {
  bin: string;
  product: string;
  qty: string;
};

export async function getLocationSummary(warehouseId: string): Promise<LocationSummaryRow[]> {
  const locations = await prisma.warehouseLocation.findMany({
    where: {
      warehouseId,
      OR: [{ occupancyStatus: { not: "EMPTY" } }, { currentStock: { gt: 0 } }],
    },
    orderBy: [{ zone: "asc" }, { locationCode: "asc" }],
  });

  if (!locations.length) return [];

  const locationIds = locations.map((l) => l.id);
  const locationCodes = locations.map((l) => l.locationCode);
  const idToCode = new Map(locations.map((l) => [l.id, l.locationCode]));

  const [pickPacks, incomingMovements] = await Promise.all([
    prisma.pickPack.findMany({
      where: { locationCode: { in: locationCodes }, status: { not: "DISPATCHED" } },
      select: {
        locationCode: true,
        order: {
          select: {
            items: { select: { quantity: true, product: { select: { name: true } } } },
          },
        },
      },
    }),
    prisma.stockMovement.findMany({
      where: { shelfLocationId: { in: locationIds }, type: "INCOMING", status: { not: "REVERSED" } },
      select: {
        shelfLocationId: true,
        items: { select: { quantity: true, product: { select: { name: true } } } },
      },
    }),
  ]);

  const ppMap = new Map<string, { products: string[]; qty: number }>();
  for (const pp of pickPacks) {
    if (!pp.order) continue;
    const entry = ppMap.get(pp.locationCode) ?? { products: [], qty: 0 };
    for (const item of pp.order.items) {
      if (!entry.products.includes(item.product.name)) entry.products.push(item.product.name);
      entry.qty += item.quantity;
    }
    ppMap.set(pp.locationCode, entry);
  }

  const incomingMap = new Map<string, { products: string[]; qty: number }>();
  for (const mv of incomingMovements) {
    if (!mv.shelfLocationId) continue;
    const code = idToCode.get(mv.shelfLocationId);
    if (!code) continue;
    const entry = incomingMap.get(code) ?? { products: [], qty: 0 };
    for (const item of mv.items) {
      if (!entry.products.includes(item.product.name)) entry.products.push(item.product.name);
      entry.qty += item.quantity;
    }
    incomingMap.set(code, entry);
  }

  return locations.map((loc) => {
    const ppData = ppMap.get(loc.locationCode);
    const inData = incomingMap.get(loc.locationCode);
    const suffix =
      loc.occupancyStatus === "PARTIAL"
        ? " (Partial)"
        : loc.occupancyStatus === "DAMAGE"
          ? " (Damaged)"
          : "";
    const allProducts = [...new Set([...(ppData?.products ?? []), ...(inData?.products ?? [])])];
    const totalQty = (ppData?.qty ?? 0) + (inData?.qty ?? 0);
    return {
      bin: loc.locationCode,
      product: allProducts.join(", ") || "—",
      qty: totalQty > 0 ? `${totalQty}${suffix}` : `—${suffix}`,
    };
  });
}

export type BinDetailOrder = {
  orderNumber: string;
  picker: string;
  status: string;
  items: { product: string; productCode: string; quantity: number }[];
};

export type BinStockItem = {
  referenceNumber: string;
  product: string;
  productCode: string;
  quantity: number;
};

export type LocationBinDetailMap = Record<
  string,
  { occupancyStatus: string; stockItems: BinStockItem[]; orders: BinDetailOrder[] }
>;

export async function getLocationBinDetailMap(warehouseId: string): Promise<LocationBinDetailMap> {
  const locations = await prisma.warehouseLocation.findMany({ where: { warehouseId } });

  const locationIds = locations.map((l) => l.id);
  const locationCodes = locations.map((l) => l.locationCode);
  const idToCode = new Map(locations.map((l) => [l.id, l.locationCode]));

  const [pickPacks, incomingMovements] = await Promise.all([
    prisma.pickPack.findMany({
      where: { locationCode: { in: locationCodes }, status: { not: "DISPATCHED" } },
      include: {
        order: {
          select: {
            orderNumber: true,
            items: { select: { quantity: true, product: { select: { name: true, sku: true } } } },
          },
        },
        picker: { select: { name: true } },
      },
    }),
    prisma.stockMovement.findMany({
      where: { shelfLocationId: { in: locationIds }, type: "INCOMING", status: { not: "REVERSED" } },
      select: {
        referenceNumber: true,
        shelfLocationId: true,
        status: true,
        items: { select: { quantity: true, product: { select: { name: true, sku: true } } } },
      },
    }),
  ]);

  // Group incoming movements by locationCode
  const incomingByCode = new Map<string, typeof incomingMovements>();
  for (const mv of incomingMovements) {
    if (!mv.shelfLocationId) continue;
    const code = idToCode.get(mv.shelfLocationId);
    if (!code) continue;
    const list = incomingByCode.get(code) ?? [];
    list.push(mv);
    incomingByCode.set(code, list);
  }

  const result: LocationBinDetailMap = {};

  for (const loc of locations) {
    const orders: BinDetailOrder[] = pickPacks
      .filter((pp) => pp.locationCode === loc.locationCode && pp.order != null)
      .map((pp) => ({
        orderNumber: pp.order!.orderNumber,
        picker: pp.picker?.name ?? "—",
        status: pp.status,
        items: pp.order!.items.map((i) => ({
          product: i.product.name,
          productCode: i.product.sku,
          quantity: i.quantity,
        })),
      }));

    const stockItems: BinStockItem[] = (incomingByCode.get(loc.locationCode) ?? []).flatMap((mv) =>
      mv.items.map((i) => ({
        referenceNumber: mv.referenceNumber,
        product: i.product.name,
        productCode: i.product.sku,
        quantity: i.quantity,
      })),
    );

    result[loc.locationCode] = { occupancyStatus: loc.occupancyStatus, stockItems, orders };
  }

  return result;
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

// ── Dashboard ─────────────────────────────────────────────────────────────────

export type DashboardStats = {
  ordersToPick: number;
  incomingStocks: number;
  readyForDispatch: number;
  damageReports: number;
};

export type DashboardPickPackRow = {
  referenceNumber: string;
  itemsCount: number;
  picker: string;
  locationCode: string;
  status: "QUEUED" | "PACKED";
};

export type DashboardGoodsRow = {
  incId: string;
  units: number;
  supplier: string;
  qcStatus: string;
  shelvingStatus: string;
};

export type DashboardAlert = {
  id: string;
  message: string;
  severity: "error" | "warning" | "info";
  time: string;
};

export type DashboardLocationBin = {
  locationCode: string;
  zone: string;
  col: string;
  occupancyStatus: string;
};

export type WarehouseDashboardData = {
  stats: DashboardStats;
  pickPackQueue: DashboardPickPackRow[];
  locationBins: DashboardLocationBin[];
  goodsReceiving: DashboardGoodsRow[];
  alerts: DashboardAlert[];
};

function timeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins !== 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

export async function getWarehouseDashboard(
  warehouseId: string | null,
): Promise<WarehouseDashboardData> {
  const [
    queuedCount,
    incomingCount,
    readyCount,
    damageCount,
    pickPacks,
    goodsRows,
    damageAlerts,
    qcAlerts,
    locationRows,
  ] = await Promise.all([
    // ordersToPick — QUEUED PickPack records linked to stock movements
    prisma.pickPack.count({ where: { stockMovementId: { not: null }, status: "QUEUED" } }),

    // incomingStocks — INCOMING movements still awaiting receipt confirmation
    prisma.stockMovement.count({
      where: {
        type: "INCOMING",
        status: "RECORDED",
        ...(warehouseId ? { warehouseId } : {}),
      },
    }),

    // readyForDispatch — PickPack records at PACKED stage
    prisma.pickPack.count({ where: { stockMovementId: { not: null }, status: "PACKED" } }),

    // damageReports — open reports for this warehouse
    prisma.damageReport.count({
      where: {
        status: "OPEN",
        ...(warehouseId ? { warehouseLocation: { warehouseId } } : {}),
      },
    }),

    // Pick & Pack queue preview (up to 10 rows) — stock-movement-based PickPacks
    prisma.pickPack.findMany({
      where: { stockMovementId: { not: null }, status: { in: ["QUEUED", "PACKED"] } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        stockMovement: {
          select: { referenceNumber: true },
        },
        picker: { select: { name: true } },
      },
    }),

    // Goods receiving preview (up to 5 rows) scoped to warehouse
    prisma.goodsReceiving.findMany({
      where: warehouseId ? { stockMovement: { warehouseId } } : {},
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { supplier: { select: { name: true } } },
    }),

    // Alerts: open damage reports
    prisma.damageReport.findMany({
      where: {
        status: "OPEN",
        ...(warehouseId ? { warehouseLocation: { warehouseId } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { warehouseLocation: { select: { locationCode: true } } },
    }),

    // Alerts: recent GoodsReceiving needing QC
    prisma.goodsReceiving.findMany({
      where: {
        qcStatus: "PENDING",
        ...(warehouseId ? { stockMovement: { warehouseId } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),

    // Location bins for this warehouse
    warehouseId
      ? prisma.warehouseLocation.findMany({
          where: { warehouseId },
          orderBy: [{ zone: "asc" }, { locationCode: "asc" }],
        })
      : Promise.resolve([] as Awaited<ReturnType<typeof prisma.warehouseLocation.findMany>>),
  ]);

  // Build pick-pack queue rows
  const pickPackQueue: DashboardPickPackRow[] = pickPacks.map((pp) => ({
    referenceNumber: pp.stockMovement?.referenceNumber ?? "—",
    itemsCount: pp.itemsCount,
    picker: pp.picker?.name ?? "—",
    locationCode: pp.locationCode || "—",
    status: pp.status as "QUEUED" | "PACKED",
  }));

  // Build goods receiving rows
  const goodsReceiving: DashboardGoodsRow[] = goodsRows.map((g) => ({
    incId: g.incId,
    units: g.units,
    supplier: g.supplier.name,
    qcStatus: g.qcStatus,
    shelvingStatus: g.shelvingStatus,
  }));

  // Build alerts
  const alerts: DashboardAlert[] = [
    ...damageAlerts.map((d) => ({
      id: d.id,
      message: `Bin ${d.warehouseLocation?.locationCode ?? "unknown"} flagged — damage reported`,
      severity: "error" as const,
      time: timeAgo(d.createdAt),
    })),
    ...qcAlerts.map((g) => ({
      id: g.id,
      message: `${g.incId} requires QC check before shelving`,
      severity: "info" as const,
      time: timeAgo(g.createdAt),
    })),
  ].slice(0, 5);

  // Build location bins
  const locationBins: DashboardLocationBin[] = locationRows.map((l) => {
    const zone = l.zone ?? l.locationCode.charAt(0);
    const col = l.locationCode.slice(zone.length);
    return { locationCode: l.locationCode, zone, col, occupancyStatus: l.occupancyStatus };
  });

  return {
    stats: {
      ordersToPick: queuedCount,
      incomingStocks: incomingCount,
      readyForDispatch: readyCount,
      damageReports: damageCount,
    },
    pickPackQueue,
    locationBins,
    goodsReceiving,
    alerts,
  };
}

// ── Outgoing movements scoped to a warehouse ──────────────────────────────────

export type WarehouseOutgoingRow = {
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

export async function getOutgoingMovementsForWarehouse(
  warehouseId: string
): Promise<WarehouseOutgoingRow[]> {
  const movements = await prisma.stockMovement.findMany({
    where: { type: "OUTGOING", warehouseId },
    include: {
      agent: true,
      toAgent: true,
      createdBy: true,
      items: { include: { product: true } },
    },
    orderBy: { date: "desc" },
  });

  const statusMap: Record<string, string> = {
    NOT_RECEIVED: "Not Received",
    RECEIVED: "Received",
    DRAFT: "Draft",
    SHELVED: "Shelved",
    QC_CHECK: "QC Check",
    RECORDED: "Recorded",
    REVERSED: "Reversed",
  };

  return movements.map((m) => {
    const totalQty = m.items.reduce((sum, i) => sum + i.quantity, 0);
    return {
      id: m.id,
      date: m.date.toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" }),
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
