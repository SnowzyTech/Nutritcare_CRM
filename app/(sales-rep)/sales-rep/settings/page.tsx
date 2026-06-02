import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { getSelfProfile, getSalesRepAnalytics } from "@/modules/users/services/users.service";
import { ProfileClient } from "./profile-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

export default async function SalesRepSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [profile, analytics] = await Promise.all([
    getSelfProfile(session.user.id),
    getSalesRepAnalytics(session.user.id),
  ]);
  if (!profile) redirect("/login");

  return (
    <div className="w-full pb-10">
      <ProfileClient
        profile={{ ...profile, teamName: profile.team?.name ?? null }}
        metrics={{
          generalPerformance: analytics.current.generalPerformance,
          deliveryRate: analytics.current.deliveryRate,
          confirmationRate: analytics.current.confirmationRate,
          performanceTrend: analytics.trends.generalPerformance,
          deliveryTrend: analytics.trends.deliveryRate,
        }}
      />
    </div>
  );
}
