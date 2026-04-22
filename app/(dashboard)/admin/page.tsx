import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, TrendingDown, MoreHorizontal } from "lucide-react";
import { DashboardLineChart, DashboardBarChart } from "@/components/dashboard/dashboard-charts";

export const metadata: Metadata = { title: "Admin Dashboard" };

/* ── Month Toggle ── */
function MonthToggle() {
  return (
    <Select defaultValue="this-month">
      <SelectTrigger className="w-[110px] h-7 text-[0.7rem] bg-gray-50/50 border-gray-200">
        <SelectValue placeholder="Select Month" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="this-month">This Month</SelectItem>
        <SelectItem value="january">January</SelectItem>
        <SelectItem value="february">February</SelectItem>
        <SelectItem value="march">March</SelectItem>
        <SelectItem value="april">April</SelectItem>
        <SelectItem value="may">May</SelectItem>
        <SelectItem value="june">June</SelectItem>
      </SelectContent>
    </Select>
  );
}

/* ── Delta badge ── */
function Delta({ value, showVs = true }: { value: string; showVs?: boolean }) {
  const positive = value.startsWith("+");
  return (
    <div className="flex items-center gap-1 mt-1">
      <span className={`text-[0.75rem] font-bold ${positive ? "text-emerald-500" : "text-rose-500"}`}>
        {value}
      </span>
      {showVs && <span className="text-[0.7rem] text-muted-foreground">vs last month</span>}
    </div>
  );
}

/* ── Account Stat Card ── */
function AccountStatCard({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <Card className="border-gray-200 shadow-none">
      <CardHeader className="p-5 pb-2 flex-row items-center justify-between space-y-0">
        <span className="text-sm font-bold text-gray-700">{label}</span>
        <MonthToggle />
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <div className="text-3xl font-bold tracking-tight text-gray-900">{value}</div>
        <Delta value={delta} />
      </CardContent>
    </Card>
  );
}

/* ── Insight Tile ── */
function InsightTile({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <Card className="border-gray-200 shadow-none">
      <CardHeader className="p-4 pb-0 flex-row items-center justify-between space-y-0">
        <span className="text-[0.8rem] font-bold text-gray-600">{label}</span>
        <MonthToggle />
      </CardHeader>
      <CardContent className="p-4 pt-1">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <Delta value={delta} />
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-8 max-w-[1400px] mx-auto p-4">
      {/* ── 1. Financial Overview ─────────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-tight mb-4">Account</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          <AccountStatCard label="Total Revenue" value="₦60,000,000" delta="+12%" />
          <AccountStatCard label="Net Profit" value="₦52,000,000" delta="+12%" />
          <AccountStatCard label="Total Expenses" value="₦8,000,000" delta="+12%" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card className="border-gray-200 shadow-none p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-[0.65rem] text-gray-400 font-bold uppercase">Sales 2022</p>
                <p className="text-xl font-bold text-gray-900">₦60.7M</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-[0.65rem] font-bold text-emerald-500 uppercase">1.2% VS LAST YEAR</span>
                </div>
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                  {["Daily", "Weekly", "Monthly"].map((t) => (
                    <button 
                      key={t} 
                      className={`px-4 py-1.5 text-[0.6rem] font-bold rounded-lg transition-all ${t === "Monthly" ? "bg-gray-900 text-white shadow-md" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <DashboardLineChart color="#8B2FE8" />
          </Card>

          <Card className="border-gray-200 shadow-none p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-[0.65rem] text-gray-400 font-bold uppercase">Sales 2022</p>
                <p className="text-xl font-bold text-gray-900">₦60.7M</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-[0.65rem] font-bold text-emerald-500 uppercase">1.2% VS LAST YEAR</span>
                </div>
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                  {["Daily", "Weekly", "Monthly"].map((t) => (
                    <button 
                      key={t} 
                      className={`px-4 py-1.5 text-[0.6rem] font-bold rounded-lg transition-all ${t === "Monthly" ? "bg-gray-900 text-white shadow-md" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <DashboardLineChart color="#3b82f6" />
          </Card>
        </div>
      </section>

      {/* ── 2. Product Overview + Growth ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 flex flex-col gap-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-tight">Product Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Row 1 */}
            <div className="p-6 rounded-2xl border border-gray-100 bg-white flex flex-col justify-between h-[150px] shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-[0.85rem] font-bold text-gray-600">Total Products Sold</span>
                <MonthToggle />
              </div>
              <div className="flex justify-between items-end">
                <span className="text-3xl font-bold text-gray-900">12,600</span>
                <div className="text-right">
                  <span className="text-[0.8rem] font-bold text-emerald-500">+21%</span>
                  <p className="text-[0.6rem] text-gray-400">vs last month</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 rounded-2xl border border-gray-100 bg-white flex flex-col justify-between h-[150px] shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-[0.85rem] font-bold text-gray-600">Total Order/Customer</span>
                <MonthToggle />
              </div>
              <div className="flex justify-between items-end">
                <span className="text-3xl font-bold text-gray-900">6000</span>
                <div className="text-right">
                  <span className="text-[0.8rem] font-bold text-emerald-500">+12%</span>
                  <p className="text-[0.6rem] text-gray-400">vs last month</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#E0E7FF]/40 border border-[#E0E7FF] flex flex-col justify-between h-[150px]">
              <div className="flex justify-between items-center">
                <span className="text-[0.85rem] font-bold text-gray-700">Best Selling Product</span>
                <MonthToggle />
              </div>
              <div className="flex justify-between items-end">
                <span className="text-2xl font-bold text-gray-900">Prosxact</span>
                <div className="text-right">
                  <p className="text-[0.65rem] font-bold text-emerald-600">Neuro-Vive Balm</p>
                  <p className="text-[0.6rem] text-gray-500">last month</p>
                </div>
              </div>
            </div>

            {/* Row 2 */}
            <div className="p-6 rounded-2xl bg-[#F5F3FF] border border-[#DDD6FE] flex flex-col justify-between h-[150px]">
              <div className="flex justify-between items-center">
                <span className="text-[0.85rem] font-bold text-[#7C3AED]">Least Selling Product</span>
                <MonthToggle />
              </div>
              <div className="flex justify-between items-end">
                <span className="text-2xl font-bold text-[#7C3AED]">Fonioi-Mill</span>
                <div className="text-right">
                  <p className="text-[0.65rem] font-bold text-[#7C3AED]">Neuro-Vive Balm</p>
                  <p className="text-[0.6rem] text-gray-500">last month</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#FFEDD5] border border-[#FED7AA] flex flex-col justify-between h-[150px]">
              <div className="flex justify-between items-center">
                <span className="text-[0.85rem] font-bold text-[#EA580C]">Most Damaged Product</span>
                <MonthToggle />
              </div>
              <div className="flex justify-between items-end">
                <span className="text-2xl font-bold text-[#EA580C]">Prosxact</span>
                <div className="text-right">
                  <p className="text-[0.65rem] font-bold text-[#EA580C]">Neuro-Vive Balm</p>
                  <p className="text-[0.6rem] text-gray-500">last month</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#8B2FE8] border border-transparent flex flex-col justify-between h-[150px] shadow-lg shadow-purple-500/20">
              <div className="flex justify-between items-center">
                <span className="text-[0.85rem] font-bold text-white">Remaining stock</span>
                <MonthToggle />
              </div>
              <div className="flex justify-between items-end">
                <span className="text-3xl font-bold text-white">15,200</span>
                <div className="text-right">
                  <p className="text-[0.65rem] font-bold text-white/90">Neuro-Vive Balm</p>
                  <p className="text-[0.6rem] text-white/70">last month</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Card className="border-gray-200 shadow-none p-6 flex flex-col h-full">
          <div className="flex justify-between items-start mb-8">
            <h2 className="text-sm font-bold text-gray-700">Growth Chart</h2>
            <MoreHorizontal size={18} className="text-gray-400" />
          </div>
          <div className="flex flex-col flex-1">
            <div className="mb-6">
              <p className="text-[0.9rem] font-bold text-gray-900">Sales</p>
              <p className="text-[0.65rem] text-gray-400">Winning report Lorem ipsum</p>
            </div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-5 h-5 rounded bg-[#3b82f6]" />
              <span className="text-3xl font-bold text-gray-900 tracking-tight">540</span>
              <span className="text-[0.7rem] text-gray-400 mt-2 font-medium">Sales</span>
            </div>
            <DashboardBarChart />
          </div>
        </Card>
      </div>

      {/* ── 3. Operational Insights ────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="flex flex-col gap-5">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-tight">Sales Overview</h2>
          <div className="grid grid-cols-2 gap-5">
            <InsightTile label="Average Orders/Day" value="80%" delta="+12%" />
            <InsightTile label="Failed Order Rate" value="80%" delta="+12%" />
            <InsightTile label="Comfimation Rate" value="76%" delta="+12%" />
            <InsightTile label="Delivery Rate" value="60%" delta="+12%" />
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-tight">Inventory Insight</h2>
          <div className="grid grid-cols-2 gap-5">
            <InsightTile label="Average Orders/Day" value="80%" delta="+12%" />
            <InsightTile label="Failed Order Rate" value="80%" delta="+12%" />
            <InsightTile label="Comfimation Rate" value="76%" delta="+12%" />
            <InsightTile label="Delivery Rate" value="60%" delta="+12%" />
          </div>
        </div>
      </div>
    </div>
  );
}

