import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { isUserTeamLead } from "@/modules/users/services/users.service";
import AddAgentClient from "./add-agent-client";

export default async function AddAgentPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";
  const isHead = !isAdmin && session?.user?.id ? await isUserTeamLead(session.user.id) : false;
  if (!isAdmin && !isHead) redirect("/logistics/agents");

  return <AddAgentClient />;
}
