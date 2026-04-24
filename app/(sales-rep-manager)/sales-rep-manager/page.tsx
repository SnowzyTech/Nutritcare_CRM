import { auth } from "@/lib/auth/auth";
import { getManagerWithTeam, getTeamMembersWithStats } from "@/modules/users/services/users.service";
import { TeamRepsClient } from "./team-reps-client";

export const dynamic = "force-dynamic";

export default async function SalesRepManagerPage() {
  const session = await auth();
  const managerId = session?.user?.id;

  const manager = managerId ? await getManagerWithTeam(managerId) : null;
  const teamId = manager?.teamId;
  const teamName = manager?.team?.name ?? "My Team";
  const reps = teamId ? await getTeamMembersWithStats(teamId) : [];

  return <TeamRepsClient reps={reps} teamName={teamName} />;
}
