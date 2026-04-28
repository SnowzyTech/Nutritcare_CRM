import { auth } from "@/lib/auth/auth";
import type { Metadata } from "next";
import { DataSidebar } from "./data/_components/Sidebar";

export const metadata: Metadata = {
  title: {
    default: "Data Analyst Dashboard",
    template: "%s | Nutricare CRM",
  },
};

export default async function DataAnalysisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <DataSidebar user={session?.user} />
      
      {/* Main area */}
      <div className="flex flex-col flex-1 overflow-hidden relative">
        <main className="flex-1 overflow-y-auto no-scrollbar">{children}</main>
      </div>
    </div>
  );
}
