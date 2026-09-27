import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getRepFollowUps } from "@/modules/reports/sales/services/follow-up.service";
import { FollowUpsClient } from "./follow-ups-client";

export const metadata: Metadata = { title: "Follow-ups" };
export const dynamic = "force-dynamic";

/**
 * The rep's customer-journey calls: Day 1 / 2 / 4 / 7 after delivery, due today
 * or missed in the last week. Marking one done feeds the manager's daily report.
 */
export default async function FollowUpsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const items = await getRepFollowUps(session.user.id);
  return <FollowUpsClient items={items} />;
}
