"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ClipboardList, 
  MessageCircle, 
  Package, 
  User, 
  Settings, 
  Bell,
  LogOut
} from "lucide-react";

export default function DeliveryAgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { label: "Order", icon: ClipboardList, href: "/delivery-agents", badge: 23 },
    { label: "Chat", icon: MessageCircle, href: "/delivery-agents/chat", badge: 6 },
    { label: "Inventory", icon: Package, href: "/delivery-agents/inventory", badge: 23 },
    { label: "Account", icon: User, href: "/delivery-agents/account" },
  ];

  return (
    <div className="flex h-screen bg-[#fafafb] text-gray-900">
      {/* Desktop Sidebar (visible on lg+) */}
      <aside className="hidden lg:flex w-64 bg-white border-r flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2">
            <img src="/nuycle-logo.png" alt="Nuycle Logo" className="h-10 w-auto object-contain" />
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.label} 
                href={item.href}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? "bg-[#faf5ff] text-[#ad1df4]" 
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5" />
                  <span className="font-semibold text-sm">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-[#ad1df4] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto space-y-2">
          <button className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-gray-700 w-full transition-colors font-medium text-sm rounded-xl hover:bg-gray-50">
            <Settings className="w-5 h-5" />
            Settings
          </button>
          <button className="flex items-center gap-3 px-4 py-3 text-red-500 hover:text-red-700 w-full transition-colors font-bold text-sm rounded-xl hover:bg-red-50">
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative pb-20 lg:pb-0">
        <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
          {children}
        </div>

        {/* Mobile Bottom Navigation (visible on <lg) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex items-center justify-around py-3 px-2 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-50">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.label} 
                href={item.href}
                className={`flex flex-col items-center gap-1 min-w-[64px] relative transition-all ${
                  isActive ? "text-[#ad1df4]" : "text-gray-400"
                }`}
              >
                <div className={`p-2 rounded-xl transition-all ${isActive ? "bg-[#faf5ff]" : ""}`}>
                  <item.icon className={`w-6 h-6 ${isActive ? "stroke-[2.5px]" : "stroke-[2px]"}`} />
                  {item.badge && (
                    <span className="absolute top-1 right-2 bg-[#ad1df4] text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-bold ${isActive ? "opacity-100" : "opacity-70"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
