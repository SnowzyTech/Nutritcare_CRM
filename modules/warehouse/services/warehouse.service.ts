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

export type AgentProductStock = {
  productId: string;
  productName: string;
  productSku: string;
  availableQty: number;
};

export async function getAgentProductStocks(agentId: string): Promise<AgentProductStock[]> {
  const stockRows = await prisma.stockLevel.findMany({
    where: { locationKind: "AGENT", locationId: agentId, quantity: { gt: 0 } },
    select: { productId: true, quantity: true },
  });
  if (!stockRows.length) return [];

  const productIds = stockRows.map((r) => r.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true, deletedAt: null },
    select: { id: true, name: true, sku: true },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));
  return stockRows
    .filter((r) => productMap.has(r.productId))
    .map((r) => {
      const p = productMap.get(r.productId)!;
      return { productId: r.productId, productName: p.name, productSku: p.sku, availableQty: r.quantity };
    });
}

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

// ── In-transit stock transfers awaiting receipt at this warehouse ─────────────

export type InTransitTransferProductItem = {
  productId: string;
  productName: string;
  productCode: string;
  requiredQty: number;
  availableShelves: TransferShelfOption[];
};

export type InTransitTransferRow = {
  id: string;
  referenceNumber: string;
  sourceWarehouseName: string;
  scheduledTime: string | null;
  items: InTransitTransferProductItem[];
};

export async function getInTransitTransfersForWarehouse(
  warehouseId: string,
): Promise<InTransitTransferRow[]> {
  const transfers = await prisma.stockTransfer.findMany({
    where: { status: "IN_TRANSIT", targetType: "WAREHOUSE", targetId: warehouseId },
    include: {
      items: { include: { product: { select: { id: true, name: true, sku: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!transfers.length) return [];

  const sourceWarehouseIds = [...new Set(
    transfers.filter((t) => t.sourceType === "WAREHOUSE").map((t) => t.sourceId),
  )];
  const sourceWarehouses =
    sourceWarehouseIds.length > 0
      ? await prisma.warehouse.findMany({
          where: { id: { in: sourceWarehouseIds } },
          select: { id: true, name: true },
        })
      : [];
  const whNameMap = new Map(sourceWarehouses.map((w) => [w.id, w.name]));

  // Fetch shelf stock in the target warehouse so the UI can offer shelf selection
  const productIds = [...new Set(transfers.flatMap((t) => t.items.map((i) => i.productId)))];
  const shelfStocks =
    productIds.length > 0
      ? await prisma.shelfProductStock.findMany({
          where: { productId: { in: productIds }, location: { warehouseId }, quantity: { gte: 0 } },
          include: { location: { select: { locationCode: true } } },
          orderBy: { quantity: "desc" },
        })
      : [];

  // Also include warehouse locations that have no shelf stock yet (for shelving onto)
  const allLocations = await prisma.warehouseLocation.findMany({
    where: { warehouseId, occupancyStatus: { not: "FULL" } },
    select: { id: true, locationCode: true },
    orderBy: { locationCode: "asc" },
  });

  // Build a shelf map keyed by productId for shelves that already have stock
  const shelfMap = new Map<string, TransferShelfOption[]>();
  for (const s of shelfStocks) {
    const list = shelfMap.get(s.productId) ?? [];
    list.push({ locationId: s.locationId, locationCode: s.location.locationCode, availableQty: s.quantity });
    shelfMap.set(s.productId, list);
  }

  // Add empty/partial locations not yet in the map for any product (qty = 0 means space available)
  const stockedLocationIds = new Set(shelfStocks.map((s) => s.locationId));
  const emptyLocations: TransferShelfOption[] = allLocations
    .filter((l) => !stockedLocationIds.has(l.id))
    .map((l) => ({ locationId: l.id, locationCode: l.locationCode, availableQty: 0 }));

  return transfers.map((t) => ({
    id: t.id,
    referenceNumber: t.referenceNumber,
    sourceWarehouseName:
      t.sourceType === "WAREHOUSE" ? (whNameMap.get(t.sourceId) ?? "—") : "—",
    scheduledTime: t.scheduledTime ? formatDate(t.scheduledTime) : null,
    items: t.items.map((i) => {
      const shelfOptions = shelfMap.get(i.productId) ?? [];
      // Merge in empty locations not already listed
      const listed = new Set(shelfOptions.map((s) => s.locationId));
      const extra = emptyLocations.filter((l) => !listed.has(l.locationId));
      return {
        productId: i.productId,
        productName: i.product.name,
        productCode: i.product.sku,
        requiredQty: i.quantity,
        availableShelves: [...shelfOptions, ...extra],
      };
    }),
  }));
}

// ── Pick & Pack ───────────────────────────────────────────────────────────────

export type TransferShelfOption = {
  locationId: string;
  locationCode: string;
  availableQty: number; // ShelfProductStock.quantity for this product
};

export type TransferProductItem = {
  productId: string;
  productName: string;
  requiredQty: number;
  availableShelves: TransferShelfOption[];
};

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
  isTransfer: boolean;
  sourceWarehouseId: string | null;
  // Populated for QUEUED transfer PickPacks so the UI can build the shelf-selection modal
  transferProducts: TransferProductItem[];
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
          warehouseId: true,
          driver: { select: { name: true } },
          driverAgent: { select: { companyName: true } },
          items: { select: { productId: true, quantity: true, product: { select: { id: true, name: true } } } },
        },
      },
      stockTransfer: {
        select: {
          id: true,
          referenceNumber: true,
          sourceId: true,
          sourceType: true,
          driver: { select: { name: true } },
          driverAgent: { select: { companyName: true } },
          items: { include: { product: { select: { id: true, name: true } } } },
        },
      },
      picker: { select: { name: true } },
      packer: { select: { name: true } },
    },
  });

  // For QUEUED transfer and outgoing PickPacks, fetch ShelfProductStock data so the UI can
  // show which shelves contain each product and how much is available.
  const queuedWithShelves = pickPacks.filter(
    (pp) =>
      pp.status === "QUEUED" &&
      (pp.stockTransfer !== null || (pp.stockMovement !== null && pp.stockMovement.warehouseId !== null)),
  );

  // Collect unique (warehouseId, productId) pairs needed
  type ShelfKey = { warehouseId: string; productId: string };
  const neededSet = new Set<string>();
  const needed: ShelfKey[] = [];

  function addNeeded(warehouseId: string, productId: string) {
    const key = `${warehouseId}:${productId}`;
    if (!neededSet.has(key)) {
      neededSet.add(key);
      needed.push({ warehouseId, productId });
    }
  }

  for (const pp of queuedWithShelves) {
    if (pp.stockTransfer) {
      const src = pp.stockTransfer;
      if (src.sourceType !== "WAREHOUSE") continue;
      for (const item of src.items) addNeeded(src.sourceId, item.productId);
    } else if (pp.stockMovement?.warehouseId) {
      for (const item of pp.stockMovement.items) addNeeded(pp.stockMovement.warehouseId, item.productId);
    }
  }

  // Batch-load ShelfProductStock for all needed pairs
  type ShelfRow = { locationId: string; locationCode: string; productId: string; qty: number };
  const shelfRows: ShelfRow[] = [];
  if (needed.length > 0) {
    const productIds = [...new Set(needed.map((n) => n.productId))];
    const whIds = [...new Set(needed.map((n) => n.warehouseId))];
    const stocks = await prisma.shelfProductStock.findMany({
      where: {
        productId: { in: productIds },
        quantity: { gt: 0 },
        location: { warehouseId: { in: whIds } },
      },
      include: { location: { select: { locationCode: true, warehouseId: true } } },
      orderBy: { quantity: "desc" },
    });
    for (const s of stocks) {
      shelfRows.push({
        locationId: s.locationId,
        locationCode: s.location.locationCode,
        productId: s.productId,
        qty: s.quantity,
      });
    }
  }

  // Index by "warehouseId:productId"
  const shelfMap = new Map<string, TransferShelfOption[]>();

  // Build a locationId → warehouseId map from the stock rows
  const locToWarehouse = new Map<string, string>();
  {
    const locationIds = [...new Set(shelfRows.map((r) => r.locationId))];
    if (locationIds.length > 0) {
      const locs = await prisma.warehouseLocation.findMany({
        where: { id: { in: locationIds } },
        select: { id: true, warehouseId: true },
      });
      for (const l of locs) locToWarehouse.set(l.id, l.warehouseId);
    }
  }

  for (const row of shelfRows) {
    const wid = locToWarehouse.get(row.locationId) ?? "";
    const key = `${wid}:${row.productId}`;
    const existing = shelfMap.get(key) ?? [];
    existing.push({ locationId: row.locationId, locationCode: row.locationCode, availableQty: row.qty });
    shelfMap.set(key, existing);
  }

  return pickPacks.map((pp) => {
    const isTransfer = pp.stockTransfer !== null;
    const sourceWarehouseId =
      isTransfer && pp.stockTransfer!.sourceType === "WAREHOUSE" ? pp.stockTransfer!.sourceId : null;

    let transferProducts: TransferProductItem[] = [];
    if (pp.status === "QUEUED") {
      if (isTransfer && sourceWarehouseId) {
        transferProducts = pp.stockTransfer!.items.map((item) => {
          const key = `${sourceWarehouseId}:${item.productId}`;
          return {
            productId: item.productId,
            productName: item.product.name,
            requiredQty: item.quantity,
            availableShelves: shelfMap.get(key) ?? [],
          };
        });
      } else if (!isTransfer && pp.stockMovement?.warehouseId) {
        const whId = pp.stockMovement.warehouseId;
        transferProducts = pp.stockMovement.items.map((item) => {
          const key = `${whId}:${item.productId}`;
          return {
            productId: item.productId,
            productName: item.product.name,
            requiredQty: item.quantity,
            availableShelves: shelfMap.get(key) ?? [],
          };
        });
      }
    }

    return {
      id: pp.id,
      referenceNumber: pp.stockMovement?.referenceNumber ?? pp.stockTransfer?.referenceNumber ?? "—",
      dispatchAgent:
        pp.stockMovement?.driver?.name ??
        pp.stockMovement?.driverAgent?.companyName ??
        pp.stockTransfer?.driver?.name ??
        pp.stockTransfer?.driverAgent?.companyName ??
        "—",
      itemsCount: pp.itemsCount,
      picker: pp.packer?.name ?? pp.picker?.name ?? "—",
      pickerId: pp.packerId ?? pp.pickerId,
      locationCode: pp.locationCode || "—",
      assignedAt: pp.assignedAt
        ? pp.assignedAt
            .toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", hour12: true })
            .toLowerCase()
        : null,
      status: pp.status as "QUEUED" | "PACKED",
      isTransfer,
      sourceWarehouseId,
      transferProducts,
    };
  });
}

export type PickerOption = {
  id: string;
  name: string;
  activeTasks: number;
};

export async function getPickPackers(warehouseId?: string | null): Promise<PickerOption[]> {
  const [packers, activeCounts] = await Promise.all([
    prisma.pickPacker.findMany({
      where: {
        isActive: true,
        ...(warehouseId ? { warehouseId } : {}),
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.pickPack.groupBy({
      by: ["packerId"],
      where: { status: "PACKED", packerId: { not: null } },
      _count: { id: true },
    }),
  ]);

  const taskMap = new Map(activeCounts.map((t) => [t.packerId as string, t._count.id]));

  return packers.map((p) => ({
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

/**
 * Derive a shelf's occupancy status from its current stock against the
 * per-shelf Full/Partial/Empty thresholds entered at zone creation.
 *
 *   stock >= fullThreshold     -> FULL
 *   stock >= partialThreshold  -> PARTIAL
 *   otherwise                  -> EMPTY
 *
 * Manually-set statuses that can't be inferred from stock (RESERVED, DAMAGE)
 * are preserved, as is the stored status when no thresholds are configured.
 */
export function deriveOccupancyStatus(
  storedStatus: string,
  currentStock: number,
  thresholds: {
    fullThreshold: number | null;
    partialThreshold: number | null;
  },
): string {
  if (storedStatus === "RESERVED" || storedStatus === "DAMAGE") return storedStatus;
  const { fullThreshold, partialThreshold } = thresholds;
  if (fullThreshold == null && partialThreshold == null) return storedStatus;
  if (fullThreshold != null && currentStock >= fullThreshold) return "FULL";
  if (partialThreshold != null && currentStock >= partialThreshold) return "PARTIAL";
  return "EMPTY";
}

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
      occupancyStatus: deriveOccupancyStatus(l.occupancyStatus, l.currentStock, {
        fullThreshold: l.fullThreshold,
        partialThreshold: l.partialThreshold,
      }),
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
  const idToCode = new Map(locations.map((l) => [l.id, l.locationCode]));

  // ShelfProductStock is now the authoritative source for what product/qty is in each bin
  const shelfStocks = await prisma.shelfProductStock.findMany({
    where: { locationId: { in: locationIds }, quantity: { gt: 0 } },
    include: { product: { select: { name: true } } },
  });

  const stockByCode = new Map<string, { products: string[]; qty: number }>();
  for (const s of shelfStocks) {
    const code = idToCode.get(s.locationId);
    if (!code) continue;
    const entry = stockByCode.get(code) ?? { products: [], qty: 0 };
    if (!entry.products.includes(s.product.name)) entry.products.push(s.product.name);
    entry.qty += s.quantity;
    stockByCode.set(code, entry);
  }

  return locations.map((loc) => {
    const data = stockByCode.get(loc.locationCode);
    const suffix =
      loc.occupancyStatus === "PARTIAL"
        ? " (Partial)"
        : loc.occupancyStatus === "DAMAGE"
          ? " (Damaged)"
          : "";
    return {
      bin: loc.locationCode,
      product: data?.products.join(", ") || "—",
      qty: (data?.qty ?? 0) > 0 ? `${data!.qty}${suffix}` : `—${suffix}`,
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
  referenceNumber?: string;
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

  const [pickPacks, shelfStocks] = await Promise.all([
    // Active pick & pack orders linked by locationCode
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
    // ShelfProductStock is the authoritative per-product-per-bin inventory
    prisma.shelfProductStock.findMany({
      where: { locationId: { in: locationIds }, quantity: { gt: 0 } },
      include: { product: { select: { name: true, sku: true } } },
    }),
  ]);

  // Group ShelfProductStock rows by locationCode
  const stockByCode = new Map<string, BinStockItem[]>();
  for (const s of shelfStocks) {
    const code = idToCode.get(s.locationId);
    if (!code) continue;
    const list = stockByCode.get(code) ?? [];
    list.push({ product: s.product.name, productCode: s.product.sku, quantity: s.quantity });
    stockByCode.set(code, list);
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

    result[loc.locationCode] = {
      occupancyStatus: deriveOccupancyStatus(loc.occupancyStatus, loc.currentStock, {
        fullThreshold: loc.fullThreshold,
        partialThreshold: loc.partialThreshold,
      }),
      stockItems: stockByCode.get(loc.locationCode) ?? [],
      orders,
    };
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
