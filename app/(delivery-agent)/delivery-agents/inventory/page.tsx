import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { Settings, Bell } from "lucide-react";
import {
  getAgentIdByUserId,
  getAgentInventory,
} from "@/modules/delivery/services/delivery-agent-portal.service";

const CARD_THEMES = [
  { theme: "bg-[#ad1df4] text-white", subTextTheme: "text-purple-100" },
  { theme: "bg-[#f3e8ff] text-[#ad1df4]", subTextTheme: "text-purple-400" },
  { theme: "bg-[#f97316] text-white", subTextTheme: "text-orange-100" },
  { theme: "bg-white text-[#4b5563] border border-gray-100", subTextTheme: "text-gray-400" },
  { theme: "bg-[#c084fc] text-white", subTextTheme: "text-purple-100" },
  { theme: "bg-[#ea580c] text-white", subTextTheme: "text-orange-100" },
  { theme: "bg-[#4c1d95] text-white", subTextTheme: "text-purple-100" },
];

export default async function InventoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const agentId = await getAgentIdByUserId(session.user.id);
  if (!agentId) redirect("/delivery-agents");

  const inventory = await getAgentInventory(agentId);

  const avatarUrl = session.user.name
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.name)}&background=f3e8ff&color=ad1df4`
    : "https://ui-avatars.com/api/?name=Agent&background=f3e8ff&color=ad1df4";

  return (
    <div className="max-w-xl mx-auto space-y-8 pb-24">
      {/* Header */}
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

      {inventory.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-bold">No inventory assigned</p>
          <p className="text-sm mt-2">Stock will appear here once assigned to you.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {inventory.map((item, index) => {
            const { theme, subTextTheme } = CARD_THEMES[index % CARD_THEMES.length];
            return (
              <div
                key={item.productId}
                className={`rounded-[32px] p-6 pt-5 flex flex-col justify-between h-[180px] shadow-sm ${theme} transition-transform hover:scale-[1.02] cursor-pointer`}
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-base font-black leading-tight max-w-[110px]">{item.productName}</h3>
                </div>
                <div className="flex items-baseline justify-between mt-auto">
                  <span className="text-6xl font-black tracking-tighter">{item.totalStock}</span>
                  <div className="text-right max-w-[80px]">
                    <p className={`text-[10px] font-bold leading-tight ${subTextTheme}`}>
                      {item.scheduled} scheduled for delivery
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
