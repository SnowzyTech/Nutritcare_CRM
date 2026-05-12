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
      invoices: { select: { status: true } },
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
    const remStatus: "Paid" | "Not Paid" = o.invoices.some(i => i.status === "PAID") ? "Paid" : "Not Paid";

    const qtyPerItem = o.items.map(it => `${it.quantity} pack${it.quantity === 1 ? "" : "s"}`).join(", ");

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

export async function getSalesRecordById(id: string) {
  const order = await prisma.order.findUnique({
    where: { id, deletedAt: null },
    include: {
      customer: true,
      agent: true,
      salesRep: { select: { id: true, name: true } },
      items: { include: { product: true } },
      invoices: { orderBy: { createdAt: "desc" }, take: 1 },
      deliveries: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!order) return null;
  const totalQty = order.items.reduce((s, it) => s + it.quantity, 0);
  return {
    id: order.id,
    orderId: order.orderNumber,
    orderStatus: titleCase(order.status),
    customer: order.customer.name,
    state: order.customer.state,
    products: order.items.map(it => it.product.name).join(", "),
    qty: `${totalQty} pack${totalQty === 1 ? "" : "s"}`,
    total: fmt(Number(order.totalAmount)),
    discount: Number(order.discountAmount) > 0
      ? `${fmt(Number(order.discountAmount))} (${Number(order.discountPercent)}%)`
      : "—",
    netAmount: fmt(Number(order.netAmount)),
    deliveryFee: fmt(Number(order.deliveryFee)),
    remStatus: (order.invoices[0]?.status === "PAID" ? "Paid" : "Not Paid") as "Paid" | "Not Paid",
    agent: order.agent?.companyName ?? "—",
    date: order.date.toISOString().slice(0, 10),
    raw: order,
  };
}

export async function getSalesRecordFilterOptions() {
  const [products, agents] = await Promise.all([
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
  ]);
  return {
    products: products.map(p => p.name),
    agents: agents.map(a => ({ id: a.id, name: a.companyName })),
  };
}
