import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { Settings, Bell } from "lucide-react";
import {
  getAgentIdByUserId,
  getAgentAccountData,
} from "@/modules/delivery/services/delivery-agent-portal.service";
import { formatDate } from "@/lib/utils";
import { LogoutButton } from "./logout-button";
import { AccountClient } from "./account-client";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const agentId = await getAgentIdByUserId(session.user.id);
  if (!agentId) redirect("/delivery-agents");

  const orders = await getAgentAccountData(agentId);

  const avatarUrl = session.user.name
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.name)}&background=f3e8ff&color=ad1df4`
    : "https://ui-avatars.com/api/?name=Agent&background=f3e8ff&color=ad1df4";

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-24">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <img src="/nuycle-logo.png" alt="Nuycle Logo" className="h-10 w-auto object-contain" />
        <div className="flex items-center gap-3">
          <button className="p-2.5 rounded-full border border-gray-100 bg-white text-gray-400 shadow-sm hover:text-gray-600 transition-colors">
            <Settings className="w-5 h-5 stroke-[1.5px]" />
          </button>
          <button className="p-2.5 rounded-full border border-gray-100 bg-white text-gray-400 shadow-sm hover:text-gray-600 transition-colors">
            <Bell className="w-5 h-5 stroke-[1.5px]" />
          </button>
          <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white shadow-md ml-1">
            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Agent name */}
      <div>
        <h2 className="text-xl font-black text-[#1e1e2d]">{session.user.name}</h2>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-0.5">Delivery Agent Account</p>
      </div>

      {/* Interactive earnings section */}
      <AccountClient orders={orders} agentName={session.user.name} avatarUrl={avatarUrl} />

      <div className="px-2">
        <LogoutButton />
      </div>

      <p className="text-xs text-gray-300 font-bold text-left px-2">
        Last Updated: {formatDate(new Date())}
      </p>
    </div>
  );
}
