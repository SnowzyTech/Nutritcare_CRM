import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { isUserTeamLead } from "@/modules/users/services/users.service";
import {
  getLogisticsManagerById,
  getLogisticsManagerMovements,
} from "@/modules/delivery/services/logistics-team.service";
import { ArrowLeft } from "lucide-react";
import { getInitials, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Manager Movements" };

const actionColor: Record<string, string> = {
  Dispatched: "bg-blue-50 text-blue-600",
  Delivered: "bg-emerald-50 text-emerald-600",
  Failed: "bg-red-50 text-red-600",
};

type Props = { params: Promise<{ managerId: string }> };

export default async function LogisticsManagerMovementsPage({ params }: Props) {
  const { managerId } = await params;

  const session = await auth();
  const userId = session?.user?.id;
  const isHead = userId ? await isUserTeamLead(userId) : false;
  if (!isHead) redirect("/logistics");

  const [manager, movements] = await Promise.all([
    getLogisticsManagerById(managerId),
    getLogisticsManagerMovements(managerId),
  ]);
  if (!manager) notFound();

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/logistics/team"
        className="flex items-center gap-2 text-gray-500 hover:text-[#ad1df4] transition-colors text-sm font-medium w-fit mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Team
      </Link>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden shrink-0">
          {manager.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={manager.avatarUrl} alt={manager.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg font-bold text-purple-600">{getInitials(manager.name)}</span>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-gray-800">{manager.name}</h1>
            {manager.isTeamLead && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#faf5ff] text-[#ad1df4]">
                Head
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">{manager.email}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Movements Handled</h2>
        </div>
        {movements.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-12">
            No dispatch or delivery-status movements recorded for this manager yet.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-6 py-2.5">Date</th>
                <th className="px-6 py-2.5">Action</th>
                <th className="px-6 py-2.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {movements.map((m) => (
                <tr key={m.id}>
                  <td className="px-6 py-3 text-gray-500 whitespace-nowrap">{formatDate(m.date)}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        actionColor[m.action] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {m.action}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {m.link ? (
                      <Link href={m.link} className="text-[#ad1df4] hover:underline">
                        {m.description}
                      </Link>
                    ) : (
                      m.description
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
