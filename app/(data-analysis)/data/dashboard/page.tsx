import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { isUserTeamLead } from "@/modules/users/services/users.service";
import {
  getCompanyAnalytics,
  getTeamsAnalytics,
  getWeeklyOrderVolume,
  getMonthlyOrderVolume,
} from "@/modules/data-analysis/services/data-analysis.service";
import { getSalesByProduct, getSalesByState } from "@/modules/finance/services/dashboard.service";
import { DashboardClient } from "./dashboard-client";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DataAnalystDashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const isTeamLead = userId ? await isUserTeamLead(userId) : false;
  if (!isTeamLead) redirect("/data");

  const year = new Date().getFullYear();

  const [company, teams, weeklyOrders, monthlyOrders, salesByProduct, salesByState] = await Promise.all([
    getCompanyAnalytics({ period: "month" }),
    getTeamsAnalytics({ period: "month" }),
    getWeeklyOrderVolume(),
    getMonthlyOrderVolume(year),
    getSalesByProduct(),
    getSalesByState(),
  ]);

  return (
    <DashboardClient
      company={company}
      teams={teams}
      weeklyOrders={weeklyOrders}
      monthlyOrders={monthlyOrders}
      salesByProduct={salesByProduct}
      salesByState={salesByState}
      year={year}
    />
  );
}
