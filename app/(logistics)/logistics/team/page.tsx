import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { isUserTeamLead } from "@/modules/users/services/users.service";
import { getLogisticsManagerStaff } from "@/modules/delivery/services/logistics-team.service";
import { ChevronRight, Users } from "lucide-react";
import { getInitials } from "@/lib/utils";

export const metadata: Metadata = { title: "Team" };

export default async function LogisticsTeamPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const isHead = userId ? await isUserTeamLead(userId) : false;
  if (!isHead) redirect("/logistics");

  const staff = await getLogisticsManagerStaff();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-[#ad1df4]" />
          Logistics Team
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          All Logistics Managers in the system. Click a name to see the dispatch/delivery movements they've personally handled.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {staff.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-12">No Logistics Managers found.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {staff.map((member) => (
              <Link
                key={member.id}
                href={`/logistics/team/${member.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden shrink-0">
                  {member.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-purple-600">{getInitials(member.name)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-800 truncate">{member.name}</p>
                    {member.isTeamLead && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#faf5ff] text-[#ad1df4]">
                        Head
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{member.email}</p>
                </div>
                <span
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                    member.isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {member.isActive ? "Active" : "Inactive"}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
