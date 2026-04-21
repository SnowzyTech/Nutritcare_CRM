import { auth } from "@/lib/auth/auth";
import {
  ShoppingCart,
  Truck,
  DollarSign,
  Users,
  TrendingUp,
  Package,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

const statCards = [
  {
    label: "Total Orders",
    value: "—",
    icon: ShoppingCart,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    description: "All time orders",
  },
  {
    label: "Active Deliveries",
    value: "—",
    icon: Truck,
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
    description: "Currently in transit",
  },
  {
    label: "Revenue",
    value: "—",
    icon: DollarSign,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    description: "Completed transactions",
  },
  {
    label: "Inventory Items",
    value: "—",
    icon: Package,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    description: "Products in stock",
  },
  {
    label: "Team Members",
    value: "—",
    icon: Users,
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
    description: "Active system users",
  },
  {
    label: "Growth",
    value: "—",
    icon: TrendingUp,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
    description: "Month over month",
  },
];

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Welcome back, {session?.user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Here&apos;s an overview of Nutricare&apos;s operations.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-xl border p-5 ${card.bg} transition-all duration-200 hover:scale-[1.01]`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  {card.label}
                </p>
                <p className="mt-2 text-3xl font-bold text-white">
                  {card.value}
                </p>
                <p className="mt-1 text-xs text-slate-500">{card.description}</p>
              </div>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bg} border`}
              >
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder panels */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/5 bg-slate-900/60 p-5">
          <h2 className="text-sm font-semibold text-white mb-3">Recent Orders</h2>
          <div className="flex items-center justify-center h-32 rounded-lg border border-white/5 border-dashed">
            <p className="text-xs text-slate-600">Connect your database to see data</p>
          </div>
        </div>
        <div className="rounded-xl border border-white/5 bg-slate-900/60 p-5">
          <h2 className="text-sm font-semibold text-white mb-3">Delivery Status</h2>
          <div className="flex items-center justify-center h-32 rounded-lg border border-white/5 border-dashed">
            <p className="text-xs text-slate-600">Connect your database to see data</p>
          </div>
        </div>
      </div>
    </div>
  );
}
