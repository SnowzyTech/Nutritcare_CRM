import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { getTeamById, getTeamMembersWithStats } from "@/modules/users/services/users.service";
import { TeamRepsClient } from "../../team-reps-client";

export const dynamic = "force-dynamic";

/**
 * Per-team drill-down — company-wide managers only. Reuses the team-lead's
 * reps view scoped to the selected team.
 */
export default async function TeamDrilldownPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "SALES_REP_MANAGER") {
    redirect("/sales-rep-manager");
  }

  const { teamId } = await params;
  const [team, reps] = await Promise.all([
    getTeamById(teamId),
    getTeamMembersWithStats(teamId),
  ]);

  if (!team) notFound();

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/sales-rep-manager"
        className="inline-flex items-center gap-1 text-sm font-semibold text-[#A020F0] hover:underline w-fit"
      >
        <ChevronLeft size={16} /> Back to overview
      </Link>
      <TeamRepsClient reps={reps} teamName={team.name} />
    </div>
  );
}
