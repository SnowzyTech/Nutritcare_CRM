import type { Metadata } from "next";
import { AccountingSidebar } from "./accounting/_components/AccountingSidebar";

export const metadata: Metadata = {
  title: {
    default: "Accounting Dashboard",
    template: "%s | Nutricare CRM",
  },
};

export default function AccountingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <AccountingSidebar />
      <div className="flex flex-col flex-1 overflow-hidden relative">
        <main className="flex-1 overflow-y-auto no-scrollbar">{children}</main>
      </div>
    </div>
  );
}
