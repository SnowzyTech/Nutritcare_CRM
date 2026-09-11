import { prisma } from "@/lib/db/prisma";
import type { OrderStatus } from "@prisma/client";

export interface SalesRecordRow {
  id: string;
  orderId: string;
  orderStatus: "Pending" | "Delivered" | "Cancelled" | "Failed" | "Confirmed";
  customer: string;
  state: string;
  products: string;
  qty: string;
  total: string;
  discount: string;
  /** Net of discount AND of the delivery fee the business pays the agent. */
  netAmount: string;
  /** Raw components so the client can recompute `netAmount` when the delivery
   *  fee is edited inline — the two columns sit side by side and would
   *  otherwise disagree until the next page load. */
  netBeforeDeliveryNum: number;
  deliveryFeeNum: number;
  deliveryFee: string;
  /** Waybill charge billed against this order, or "—" when there is none. */
  waybill: string;
  waybillNum: number;
  remStatus: "Paid" | "Not Paid";
  agent: string;
  /** `Agent.id` the order is assigned to, or `null` when unassigned. The agent
   *  filter keys on this rather than the display name, which is not unique. */
  agentId: string | null;
  /** Date the order came into the system (order date). */
  date: string;
  /** Date the order's status last changed (delivered/cancelled/failed/confirmed
   *  day). `null` while still PENDING — no status change has happened yet. */
  statusDate: string | null;
}

const fmt = (n: number) =>
  `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

const titleCase = (s: string) =>
  s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

/**
 * Waybill charges for a page of orders, keyed by order NUMBER.
 *
 * A waybill cost is recorded as a PAYMENT settlement adjustment against the
 * agent and tied to exactly one order: the Settlement Adjustment form
 * single-selects an order and writes its *number* — not its id — into both
 * `linkedReferenceId` and `ordersJson`. (The remittance batch on
 * `AgentSettlement.ordersJson` keys on order ids instead; the two differ.)
 *
 * OVERPAYMENT rows are excluded even when their `paymentType` reads "Waybill":
 * those are refunds, not logistics costs — the same rule the Delivery Tracker
 * report applies in `reports-accounting.service.ts`.
 */
async function getWaybillChargesByOrderNumber(
  orders: { orderNumber: string; agentId: string | null }[],
): Promise<Map<string, number>> {
  const totals = new Map<string, number>();
  if (orders.length === 0) return totals;

  const orderNumbers = orders.map(o => o.orderNumber);
  const agentIds = [...new Set(orders.map(o => o.agentId).filter((a): a is string => !!a))];

  const rows = await prisma.settlementAdjustment.findMany({
    where: {
      adjustmentType: "PAYMENT",
      paymentType: "Waybill",
      OR: [
        // The reference IS the order number for every order-tied payment.
        { linkedReferenceId: { in: orderNumbers } },
        // Safety net for rows that carry only `ordersJson`. Scoped to the agents
        // on this page so the set stays bounded rather than scanning the table.
        ...(agentIds.length > 0 ? [{ agentId: { in: agentIds } }] : []),
      ],
    },
    select: { linkedReferenceId: true, ordersJson: true, amount: true },
  });

  const wanted = new Set(orderNumbers);
  for (const row of rows) {
    // A row can match on both the reference and the JSON array — collect the
    // order numbers it names in a set so its amount is counted once each.
    const named = new Set<string>();
    if (wanted.has(row.linkedReferenceId)) named.add(row.linkedReferenceId);
    if (Array.isArray(row.ordersJson)) {
      for (const v of row.ordersJson) {
        if (typeof v === "string" && wanted.has(v)) named.add(v);
      }
    }
    const amount = Number(row.amount);
    for (const n of named) totals.set(n, (totals.get(n) ?? 0) + amount);
  }
  return totals;
}

export async function getSalesRecords(filters: {
  search?: string;
  state?: string;
  agentId?: string;
  status?: string;
  productName?: string;
  from?: Date;
  to?: Date;
} = {}): Promise<SalesRecordRow[]> {
  const { search, state, agentId, status, productName, from, to } = filters;

  const orders = await prisma.order.findMany({
    where: {
      deletedAt: null,
      ...(status && status !== "All" ? { status: status.toUpperCase() as OrderStatus } : {}),
      ...(agentId && agentId !== "All" ? { agentId } : {}),
      ...(state && state !== "All" ? { customer: { state } } : {}),
      ...(from || to ? { date: { ...(from && { gte: from }), ...(to && { lte: to }) } } : {}),
      ...(productName && productName !== "All"
        ? { items: { some: { product: { name: { contains: productName, mode: "insensitive" } } } } }
        : {}),
      ...(search
        ? {
            OR: [
              { orderNumber: { contains: search, mode: "insensitive" } },
              { customer: { name: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      customer: { select: { name: true, state: true } },
      agent: { select: { id: true, companyName: true, state: true } },
      items: { select: { quantity: true, product: { select: { name: true } } } },
    },
    orderBy: { date: "desc" },
    take: 200,
  });

  const waybillTotals = await getWaybillChargesByOrderNumber(orders);

  return orders.map(o => {
    const totalQty = o.items.reduce((s, it) => s + it.quantity, 0);
    const products = o.items.map(it => it.product.name).join(", ");
    const totalNum = Number(o.totalAmount);
    const discountNum = Number(o.discountAmount);
    const discountPct = Number(o.discountPercent);
    const remStatus: "Paid" | "Not Paid" = o.remittanceStatus === "REMITTED" ? "Paid" : "Not Paid";
    const netBeforeDelivery = Number(o.netAmount);
    const deliveryFeeNum = Number(o.deliveryFee);

    const waybillNum = waybillTotals.get(o.orderNumber) ?? 0;

    const qtyPerItem = o.items.map(it => it.quantity).join(", ");

    return {
      id: o.id,
      orderId: o.orderNumber,
      orderStatus: titleCase(o.status) as SalesRecordRow["orderStatus"],
      customer: o.customer.name,
      state: o.customer.state,
      products,
      qty: qtyPerItem,
      total: fmt(totalNum),
      discount: discountNum > 0 ? `${fmt(discountNum)} (${discountPct}%)` : "—",
      // The delivery fee is a cost the business pays the agent, not something
      // the customer is billed for, so it comes off the net figure here.
      netAmount: fmt(netBeforeDelivery - deliveryFeeNum),
      netBeforeDeliveryNum: netBeforeDelivery,
      deliveryFeeNum,
      deliveryFee: fmt(deliveryFeeNum),
      waybill: waybillNum > 0 ? fmt(waybillNum) : "—",
      waybillNum,
      remStatus,
      agent: o.agent?.companyName ?? "—",
      agentId: o.agent?.id ?? null,
      date: o.date.toISOString().slice(0, 10),
      statusDate:
        o.status === "PENDING" ? null : o.updatedAt.toISOString().slice(0, 10),
    };
  });
}

export interface OrderInvoiceLine {
  description: string;
  quantity: number;
  unit: string | null;
  unitPrice: number;
  amount: number;
  // Sales-rep-upsold portion of this line (0 for formal invoice items, which
  // carry no upsell data). Finance-only display; see docs/upsell-display-rollout.md.
  upsellQuantity: number;
  upsellAmount: number;
}

export interface OrderInvoiceDetail {
  id: string;
  orderNumber: string;
  orderStatus: string;
  remStatus: "Paid" | "Not Paid";
  // amounts (raw numbers — the client formats them)
  totalAmount: number;
  discountAmount: number;
  discountPercent: number;
  /** Goods net of discount. This is the invoice basis — delivery is excluded. */
  netAmount: number;
  /** Internal margin view: netAmount minus the delivery fee paid to the agent.
   *  Matches the Net Amount column on the sales-record list. Never billed. */
  netAfterDelivery: number;
  deliveryFee: number;
  invoiceTotal: number;
  notes: string | null;
  // dates (ISO date strings, "YYYY-MM-DD")
  orderDate: string;
  createdAt: string;
  deliveredAt: string | null;
  // people
  customer: {
    name: string;
    email: string | null;
    phone: string;
    whatsappNumber: string | null;
    address: string;
    state: string;
    lga: string;
    landmark: string | null;
  };
  agent: string | null;
  agentId: string | null;
  salesRep: string | null;
  totalQty: number;
  items: OrderInvoiceLine[];
  // invoice — either a real persisted invoice or one derived from the order
  invoice: {
    exists: boolean;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string | null;
    terms: string | null;
    status: string;
    subtotal: number;
    discountPercent: number;
    discountAmount: number;
    shipping: number;
    invoiceTotal: number;
    items: OrderInvoiceLine[];
  };
}

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export async function getSalesRecordById(id: string): Promise<OrderInvoiceDetail | null> {
  const order = await prisma.order.findFirst({
    where: { id, deletedAt: null },
    include: {
      customer: true,
      agent: true,
      salesRep: { select: { id: true, name: true } },
      items: { include: { product: { select: { name: true, unit: true } } } },
      invoices: { include: { items: true }, orderBy: { createdAt: "desc" }, take: 1 },
      deliveries: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!order) return null;

  const totalQty = order.items.reduce((s, it) => s + it.quantity, 0);
  const orderLines: OrderInvoiceLine[] = order.items.map(it => ({
    description: it.product.name,
    quantity: it.quantity,
    unit: it.product.unit,
    unitPrice: Number(it.unitPrice),
    amount: Number(it.lineTotal),
    upsellQuantity: it.upsellQuantity,
    upsellAmount: Number(it.upsellAmount),
  }));

  const totalAmount = Number(order.totalAmount);
  const discountAmount = Number(order.discountAmount);
  const discountPercent = Number(order.discountPercent);
  const netAmount = Number(order.netAmount);
  const deliveryFee = Number(order.deliveryFee);
  // What the customer owes: goods net of discount, and nothing else. Delivery is
  // paid by the business to the agent, not billed to the customer, so it is
  // deliberately NOT added here. `deliveryFee` is still returned separately for
  // the internal margin view — it just never reaches the customer-facing total.
  const invoiceTotal = netAmount;

  const delivery = order.deliveries[0];
  const existing = order.invoices[0];

  const invoice: OrderInvoiceDetail["invoice"] = existing
    ? {
        exists: true,
        invoiceNumber: existing.invoiceNumber,
        invoiceDate: isoDate(existing.invoiceDate),
        dueDate: existing.dueDate ? isoDate(existing.dueDate) : null,
        terms: existing.terms,
        status: titleCase(existing.status),
        subtotal: Number(existing.subtotal),
        discountPercent: Number(existing.discountPercent),
        discountAmount: Number(existing.discountAmount),
        shipping: Number(existing.shipping),
        invoiceTotal: Number(existing.invoiceTotal),
        items: existing.items.map(it => ({
          description: it.description,
          quantity: it.quantity,
          unit: null,
          unitPrice: Number(it.rate),
          amount: Number(it.amount),
          upsellQuantity: 0,
          upsellAmount: 0,
        })),
      }
    : {
        // No invoice has been generated yet — derive a preview straight from the order.
        exists: false,
        invoiceNumber: `${order.orderNumber}-INV`,
        invoiceDate: isoDate(order.date),
        dueDate: null,
        terms: "Due on delivery",
        status: "Draft",
        subtotal: totalAmount,
        discountPercent,
        discountAmount,
        // Customer is not charged for delivery — the PDF omits the line
        // entirely when shipping is 0 (lib/pdf/invoice-pdf.ts:141).
        shipping: 0,
        invoiceTotal,
        items: orderLines,
      };

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    orderStatus: titleCase(order.status),
    remStatus: order.remittanceStatus === "REMITTED" ? "Paid" : "Not Paid",
    totalAmount,
    discountAmount,
    discountPercent,
    netAmount,
    netAfterDelivery: netAmount - deliveryFee,
    deliveryFee,
    invoiceTotal,
    notes: order.notes,
    orderDate: isoDate(order.date),
    createdAt: isoDate(order.createdAt),
    deliveredAt:
      delivery?.deliveredTime ? isoDate(delivery.deliveredTime) : null,
    customer: {
      name: order.customer.name,
      email: order.customer.email,
      phone: order.customer.phone,
      whatsappNumber: order.customer.whatsappNumber,
      address: order.customer.deliveryAddress,
      state: order.customer.state,
      lga: order.customer.lga,
      landmark: order.customer.landmark,
    },
    agent: order.agent?.companyName ?? null,
    agentId: order.agentId ?? null,
    salesRep: order.salesRep?.name ?? null,
    totalQty,
    items: orderLines,
    invoice,
  };
}

export async function getSalesRecordFilterOptions() {
  const [products, agents, customerStates] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, deletedAt: null },
      select: { name: true },
      orderBy: { name: "asc" },
    }),
    prisma.agent.findMany({
      where: { deletedAt: null },
      select: { id: true, companyName: true },
      orderBy: { companyName: "asc" },
    }),
    // Derive states from the customers that actually have orders, so the
    // filter values match exactly how state was stored at order creation.
    prisma.customer.findMany({
      where: { deletedAt: null, orders: { some: { deletedAt: null } } },
      select: { state: true },
      distinct: ["state"],
      orderBy: { state: "asc" },
    }),
  ]);
  const states = Array.from(
    new Set(customerStates.map(c => c.state).filter((s): s is string => !!s && s.trim() !== "")),
  );
  return {
    products: products.map(p => p.name),
    agents: agents.map(a => ({ id: a.id, name: a.companyName })),
    states,
  };
}

/* ------------------------------------------------------------------ *
 * Per-order remittance info
 * ------------------------------------------------------------------ */

/** One order that shared the remittance batch this order was cleared in. */
export interface RemittanceCoveredOrder {
  id: string;
  orderNumber: string;
  customer: string;
  netAmount: number;
  /** True for the order the detail page is showing. */
  isCurrent: boolean;
}

export interface OrderRemittanceInfo {
  orderId: string;
  orderNumber: string;
  status: "Paid" | "Not Paid";
  /** Why no remittance exists yet — drives the empty state. `null` once remitted. */
  pendingReason:
    | "NO_AGENT"
    | "NOT_DELIVERED"
    | "AWAITING_REMITTANCE"
    | "MISSING_SETTLEMENT"
    | null;
  agent: { id: string; name: string; state: string | null; phone: string } | null;
  /** What the agent collected on this order and owes the company. */
  expected: number;
  /** Delivery fee the business pays the agent for this order. */
  deliveryFee: number;
  /** The DELIVERY_FEE ledger entry ("Agent Funding") raised when the order was delivered. */
  funding: {
    referenceId: string;
    date: string;
    amount: number;
    runningBalance: number;
  } | null;
  /** The remittance batch that cleared this order. */
  settlement: {
    id: string;
    /** `REM-xxxx` from the linked ledger entry; null for legacy rows with no entry. */
    referenceId: string | null;
    ledgerEntryId: string | null;
    date: string;
    /** "Moniepoint" / "Zenith"; null on remittances recorded before the field existed. */
    bank: string | null;
    totalSalesValue: number;
    deliveryFeesEarned: number;
    totalRemitted: number;
    balance: number;
    overpayment: number;
    underpayment: number;
    runningBalanceAfter: number | null;
    orders: RemittanceCoveredOrder[];
  } | null;
  /** Settlement adjustments explicitly tagged with this order. */
  adjustments: {
    id: string;
    date: string;
    type: string;
    paymentType: string;
    referenceId: string;
    amount: number;
    note: string | null;
    recordedBy: string | null;
  }[];
  /** The agent's latest running balance across every order, not just this one. */
  agentBalance: number | null;
}

const titleCaseWords = (s: string) =>
  s
    .toLowerCase()
    .split("_")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const bankName = (bank: string | null): string | null =>
  bank === "MONIEPOINT" ? "Moniepoint" : bank === "ZENITH" ? "Zenith" : null;

/**
 * Everything accounting needs to answer "was this order remitted, by whom, into
 * which bank, and as part of which batch?".
 *
 * An order is tied to a remittance through `AgentSettlement.ordersJson` — a JSONB
 * array of order ids written by `createRemittanceAction`. There is no FK, so the
 * lookup is a containment filter scoped to the order's agent (the `agentId`
 * index keeps it cheap).
 *
 * Returns `null` only when the order itself does not exist; an un-remitted order
 * still returns a populated row with `pendingReason` set, so the UI can explain
 * the empty state instead of showing nothing.
 */
export async function getOrderRemittanceInfo(
  orderId: string,
): Promise<OrderRemittanceInfo | null> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, deletedAt: null },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      remittanceStatus: true,
      netAmount: true,
      deliveryFee: true,
      agentId: true,
      agent: { select: { id: true, companyName: true, state: true, phone1: true } },
    },
  });
  if (!order) return null;

  const base = {
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: (order.remittanceStatus === "REMITTED" ? "Paid" : "Not Paid") as "Paid" | "Not Paid",
    expected: Number(order.netAmount),
    deliveryFee: Number(order.deliveryFee),
    agent: order.agent
      ? {
          id: order.agent.id,
          name: order.agent.companyName,
          state: order.agent.state,
          phone: order.agent.phone1,
        }
      : null,
  };

  // No agent on the order means nothing can ever be remitted against it.
  if (!order.agentId) {
    return {
      ...base,
      pendingReason: "NO_AGENT",
      funding: null,
      settlement: null,
      adjustments: [],
      agentBalance: null,
    };
  }
  const agentId = order.agentId;

  const [settlement, funding, adjustments, lastEntry] = await Promise.all([
    prisma.agentSettlement.findFirst({
      where: { agentId, ordersJson: { array_contains: [order.id] } },
      orderBy: { date: "desc" },
      include: {
        ledgerEntries: {
          where: { referenceType: "REMITTANCE" },
          orderBy: { createdAt: "asc" },
          take: 1,
          select: { id: true, referenceId: true, runningBalance: true },
        },
      },
    }),
    prisma.agentLedgerEntry.findFirst({
      // DELIVERY_FEE entries key on the order NUMBER, not the id — see
      // `recordDeliveryFeeEntry` in agent-settlement.service.ts.
      where: { agentId, referenceType: "DELIVERY_FEE", referenceId: order.orderNumber },
      select: { referenceId: true, date: true, debit: true, runningBalance: true },
    }),
    prisma.settlementAdjustment.findMany({
      // Careful: adjustments key on the order NUMBER, while the remittance batch
      // above keys on the order ID — `AgentSettlementClient` maps the picked
      // order to `o.orderId` (the number) before sending `ordersJson`, and sets
      // `linkedReferenceId` to that same number for PAYMENT rows. Rows with a
      // `MANUAL-*`/`REM-*` reference are agent-level and match neither.
      where: {
        agentId,
        OR: [
          { ordersJson: { array_contains: [order.orderNumber] } },
          { linkedReferenceId: order.orderNumber },
        ],
      },
      orderBy: { date: "desc" },
      select: {
        id: true,
        date: true,
        adjustmentType: true,
        paymentType: true,
        linkedReferenceId: true,
        amount: true,
        note: true,
        createdBy: { select: { name: true } },
      },
    }),
    prisma.agentLedgerEntry.findFirst({
      where: { agentId },
      orderBy: { createdAt: "desc" },
      select: { runningBalance: true },
    }),
  ]);

  // Resolve the sibling orders the batch covered, so the accountant can see this
  // order was cleared alongside others rather than on its own.
  let coveredOrders: RemittanceCoveredOrder[] = [];
  if (settlement && Array.isArray(settlement.ordersJson)) {
    const ids = settlement.ordersJson.filter((v): v is string => typeof v === "string");
    if (ids.length > 0) {
      const rows = await prisma.order.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          orderNumber: true,
          netAmount: true,
          customer: { select: { name: true } },
        },
        orderBy: { date: "asc" },
      });
      coveredOrders = rows.map(r => ({
        id: r.id,
        orderNumber: r.orderNumber,
        customer: r.customer.name,
        netAmount: Number(r.netAmount),
        isCurrent: r.id === order.id,
      }));
    }
  }

  const entry = settlement?.ledgerEntries[0] ?? null;

  // An order flagged REMITTED with no settlement behind it means the batch was
  // deleted or predates `ordersJson` — say so rather than implying it is unpaid.
  const pendingReason: OrderRemittanceInfo["pendingReason"] = settlement
    ? null
    : base.status === "Paid"
      ? "MISSING_SETTLEMENT"
      : order.status === "DELIVERED"
        ? "AWAITING_REMITTANCE"
        : "NOT_DELIVERED";

  return {
    ...base,
    pendingReason,
    funding: funding
      ? {
          referenceId: funding.referenceId,
          date: isoDate(funding.date),
          amount: Number(funding.debit),
          runningBalance: Number(funding.runningBalance),
        }
      : null,
    settlement: settlement
      ? {
          id: settlement.id,
          referenceId: entry?.referenceId ?? null,
          ledgerEntryId: entry?.id ?? null,
          date: isoDate(settlement.date),
          bank: bankName(settlement.bank),
          totalSalesValue: Number(settlement.totalSalesValue),
          deliveryFeesEarned: Number(settlement.deliveryFeesEarned),
          totalRemitted: Number(settlement.totalRemitted),
          balance: Number(settlement.balance),
          overpayment: Number(settlement.overpayment),
          underpayment: Number(settlement.underpayment),
          runningBalanceAfter: entry ? Number(entry.runningBalance) : null,
          orders: coveredOrders,
        }
      : null,
    adjustments: adjustments.map(a => ({
      id: a.id,
      date: isoDate(a.date),
      type: titleCaseWords(a.adjustmentType),
      paymentType: titleCaseWords(a.paymentType),
      referenceId: a.linkedReferenceId,
      amount: Number(a.amount),
      note: a.note,
      recordedBy: a.createdBy?.name ?? null,
    })),
    agentBalance: lastEntry ? Number(lastEntry.runningBalance) : 0,
  };
}
