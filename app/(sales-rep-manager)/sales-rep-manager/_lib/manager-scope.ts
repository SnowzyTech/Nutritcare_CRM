import { auth } from "@/lib/auth/auth";
import {
  getManagerWithTeam,
  getTeamMembersWithStats,
  getAllActiveSalesReps,
} from "@/modules/users/services/users.service";

export type ScopedRep = {
  id: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  pendingOrders: number;
  performance: number;
  teamId?: string | null;
  teamName?: string | null;
};

/**
 * Resolves which sales reps the current viewer oversees.
 *  • Company manager (role SALES_REP_MANAGER) → every active sales rep.
 *  • Team-lead (SALES_REP + isTeamLead)        → their team only.
 * Both share the /sales-rep-manager dashboard; pages branch on `isCompanyManager`.
 */
export async function resolveManagerScope(): Promise<{
  isCompanyManager: boolean;
  reps: ScopedRep[];
  teamId: string | null;
  teamName: string;
}> {
  const session = await auth();
  const user = session?.user;
  const isCompanyManager = user?.role === "SALES_REP_MANAGER";

  if (isCompanyManager) {
    const reps = await getAllActiveSalesReps();
    return { isCompanyManager, reps, teamId: null, teamName: "All Sales Reps" };
  }

  const manager = user?.id ? await getManagerWithTeam(user.id) : null;
  const teamId = manager?.teamId ?? null;
  const reps = teamId ? await getTeamMembersWithStats(teamId) : [];
  return {
    isCompanyManager,
    reps,
    teamId,
    teamName: manager?.team?.name ?? "My Team",
  };
}
