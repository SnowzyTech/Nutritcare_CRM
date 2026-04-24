import { SalesRepManagerSidebarClient } from "./sales-rep-manager/sidebar-client";
import { MessageSquare } from "lucide-react";

export default function SalesRepManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <SalesRepManagerSidebarClient />
      <div className="flex flex-col flex-1 overflow-hidden relative">
        <header className="absolute top-0 right-0 left-0 h-20 px-8 flex justify-between items-center z-10 pointer-events-none">
          {/* We use pointer-events-none on header, but auto on children to let clicks through where needed */}
          <div></div>
          <div className="flex items-center gap-4 pointer-events-auto">
            <button className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-800 transition flex items-center gap-2">
              ← Sales Rep Mode
            </button>
            <button className="w-10 h-10 bg-purple-100 text-[#A020F0] rounded-full flex items-center justify-center hover:bg-purple-200 transition">
              <MessageSquare size={18} fill="currentColor" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
