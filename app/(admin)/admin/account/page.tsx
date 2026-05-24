import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

export const metadata: Metadata = { title: "Account — Admin" };

async function getAccountPageData() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    paidInvoiceCount,
    paidInvoiceSum,
    expenseSum,
    expenseCount,
    productStats,
    lowStockProducts,
    openPOs,
    warehouseStats,
    locationStats,
    deliveryStats,
    orderStats,
  ] = await Promise.all([
    // Finance: count of paid invoices this month
    prisma.invoice.count({ where: { status: "PAID", createdAt: { gte: monthStart } } }),
    // Finance: sum of paid invoice totals this month
    prisma.invoice.aggregate({
      where: { status: "PAID", createdAt: { gte: monthStart } },
      _sum: { invoiceTotal: true },
    }),
    // Finance: expense totals this month
    prisma.expense.aggregate({
      where: { date: { gte: monthStart } },
      _sum: { amount: true },
    }),
    // Finance: expense count this month
    prisma.expense.count({ where: { date: { gte: monthStart } } }),
    // Inventory: product counts
    prisma.product.aggregate({
      where: { isActive: true, deletedAt: null },
      _count: { id: true },
    }),
    // Inventory: low-stock products (stock computed from movements)
    prisma.product.count({
      where: { isActive: true, deletedAt: null, lowStockAlertQtyTotal: { gt: 0 } },
    }),
    // Inventory: open purchase orders
    prisma.purchaseOrder.count({ where: { status: { in: ["PENDING", "IN_TRANSIT"] } } }),
    // Warehouse: count
    prisma.warehouse.count({ where: { deletedAt: null } }),
    // Warehouse: locations aggregate
    prisma.warehouseLocation.aggregate({ _count: { id: true }, _sum: { currentStock: true } }),
    // Logistics: delivery stats
    prisma.delivery.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    // Data Analysis: order stats
    prisma.order.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { id: true },
    }),
  ]);

  const deliveryMap = Object.fromEntries(
    deliveryStats.map((d) => [d.status, d._count.id])
  );
  const orderMap = Object.fromEntries(
    orderStats.map((o) => [o.status, o._count.id])
  );
  const totalOrders = Object.values(orderMap).reduce((s, v) => s + v, 0);
  const deliveredOrders = orderMap["DELIVERED"] ?? 0;
  const deliveryRate =
    totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;

  return {
    finance: {
      paidInvoices: paidInvoiceCount,
      revenue: Number(paidInvoiceSum._sum.invoiceTotal ?? 0),
      expenses: Number(expenseSum._sum.amount ?? 0),
      expenseCount,
    },
    inventory: {
      totalProducts: productStats._count.id,
      lowStockCount: lowStockProducts,
      openPOs,
    },
    warehouse: {
      warehouseCount: warehouseStats,
      locationCount: locationStats._count.id,
      totalStock: locationStats._sum.currentStock ?? 0,
    },
    logistics: {
      inTransit: deliveryMap["IN_TRANSIT"] ?? 0,
      delivered: deliveryMap["DELIVERED"] ?? 0,
      failed: deliveryMap["FAILED"] ?? 0,
    },
    dataAnalysis: {
      totalOrders,
      deliveredOrders,
      deliveryRate,
      pendingOrders: (orderMap["PENDING"] ?? 0) + (orderMap["CONFIRMED"] ?? 0),
    },
  };
}

function formatCurrency(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

function SummaryCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
      <p className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-xl font-black text-slate-800">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function DeptSection({
  title,
  role,
  href,
  children,
}: {
  title: string;
  role: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-black text-slate-800">{title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{role}</p>
        </div>
        <Link
          href={href}
          className="text-xs font-bold text-purple-600 bg-purple-50 border border-purple-100 px-4 py-2 rounded-full hover:bg-purple-100 transition-colors whitespace-nowrap"
        >
          View as {role} →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-6">{children}</div>
    </div>
  );
}

export default async function AdminAccountPage() {
  const data = await getAccountPageData();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Account</h1>
        <p className="text-sm text-slate-500 mt-1">
          Overview of each department&apos;s key metrics.
        </p>
      </div>

      {/* Finance / Accounting */}
      <DeptSection title="Finance" role="Accountant" href="/accounting">
        <SummaryCard
          label="Paid Invoices (this month)"
          value={data.finance.paidInvoices}
        />
        <SummaryCard
          label="Revenue (this month)"
          value={formatCurrency(data.finance.revenue)}
        />
        <SummaryCard
          label="Expenses (this month)"
          value={formatCurrency(data.finance.expenses)}
          sub={`${data.finance.expenseCount} entries`}
        />
      </DeptSection>

      {/* Inventory */}
      <DeptSection title="Inventory" role="Inventory Manager" href="/inventory">
        <SummaryCard label="Total Products" value={data.inventory.totalProducts} />
        <SummaryCard
          label="Low-Stock Alerts"
          value={data.inventory.lowStockCount}
          sub="products with threshold set"
        />
        <SummaryCard
          label="Open Purchase Orders"
          value={data.inventory.openPOs}
          sub="pending or in transit"
        />
      </DeptSection>

      {/* Warehouse */}
      <DeptSection title="Warehouse" role="Warehouse Manager" href="/warehouse">
        <SummaryCard label="Warehouses" value={data.warehouse.warehouseCount} />
        <SummaryCard label="Shelf Locations" value={data.warehouse.locationCount} />
        <SummaryCard
          label="Total Stock on Shelves"
          value={data.warehouse.totalStock.toLocaleString()}
          sub="units across all locations"
        />
      </DeptSection>

      {/* Data Analysis */}
      <DeptSection title="Data Analysis" role="Data Analyst" href="/data">
        <SummaryCard label="Total Orders" value={data.dataAnalysis.totalOrders} />
        <SummaryCard
          label="Delivered Orders"
          value={data.dataAnalysis.deliveredOrders}
          sub={`${data.dataAnalysis.deliveryRate}% delivery rate`}
        />
        <SummaryCard
          label="Open Orders"
          value={data.dataAnalysis.pendingOrders}
          sub="pending + confirmed"
        />
      </DeptSection>

      {/* Logistics */}
      <DeptSection title="Logistics" role="Logistics Manager" href="/logistics">
        <SummaryCard
          label="In Transit"
          value={data.logistics.inTransit}
          sub="deliveries in progress"
        />
        <SummaryCard label="Delivered" value={data.logistics.delivered} />
        <SummaryCard label="Failed Deliveries" value={data.logistics.failed} />
      </DeptSection>
    </div>
  );
}
