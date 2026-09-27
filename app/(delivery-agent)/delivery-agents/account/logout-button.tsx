"use client";

import { LogOut } from "lucide-react";
import { signOutAndUnsubscribe } from "@/lib/auth/client-sign-out";

export function LogoutButton() {
  return (
    <button
      onClick={() => void signOutAndUnsubscribe({ callbackUrl: "/login" })}
      className="w-full bg-[#faf5ff] text-red-500 font-bold h-14 rounded-2xl flex items-center justify-center gap-3 hover:bg-red-50 transition-colors border border-red-100"
    >
      <LogOut className="w-5 h-5" />
      Log Out
    </button>
  );
}
