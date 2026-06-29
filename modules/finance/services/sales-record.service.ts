import { prisma } from "@/lib/db/prisma";

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
  netAmount: string;
  deliveryFee: string;
  remStatus: "Paid" | "Not Paid";
  agent: string;
  date: string;
}

const fmt = (n: number) =>
  `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

const titleCase = (s: string) =>
  s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

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
      ...(status && status !== "All" ? { status: status.toUpperCase() as any } : {}),
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

  return orders.map(o => {
    const totalQty = o.items.reduce((s, it) => s + it.quantity, 0);
    const products = o.items.map(it => it.product.name).join(", ");
    const totalNum = Number(o.totalAmount);
    const discountNum = Number(o.discountAmount);
    const discountPct = Number(o.discountPercent);
    const remStatus: "Paid" | "Not Paid" = o.remittanceStatus === "REMITTED" ? "Paid" : "Not Paid";

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
      netAmount: fmt(Number(o.netAmount)),
      deliveryFee: fmt(Number(o.deliveryFee)),
      remStatus,
      agent: o.agent?.companyName ?? "—",
      date: o.date.toISOString().slice(0, 10),
    };
  });
}

export interface OrderInvoiceLine {
  description: string;
  quantity: number;
  unit: string | null;
  unitPrice: number;
  amount: number;
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
  netAmount: number;
  deliveryFee: number;
  invoiceTotal: number;
  notes: string | null;
  // dates (ISO date strings, "YYYY-MM-DD")
  orderDate: string;
  createdAt: string;
  deliveredAt: string | null;
  remittedAt: string | null;
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
  }));

  const totalAmount = Number(order.totalAmount);
  const discountAmount = Number(order.discountAmount);
  const discountPercent = Number(order.discountPercent);
  const netAmount = Number(order.netAmount);
  const deliveryFee = Number(order.deliveryFee);
  // What the customer owes: net of discount, plus delivery/shipping.
  const invoiceTotal = netAmount + deliveryFee;

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
        shipping: deliveryFee,
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
    deliveryFee,
    invoiceTotal,
    notes: order.notes,
    orderDate: isoDate(order.date),
    createdAt: isoDate(order.createdAt),
    deliveredAt:
      delivery?.deliveredTime ? isoDate(delivery.deliveredTime) : null,
    remittedAt: null,
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
