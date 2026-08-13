"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

/**
 * Rendered by the delivery-agent layout when the signed-in agent is no longer
 * allowed in (suspended or removed). Clears the session on mount and sends them
 * to the login screen — the practical "immediate logout" for a JWT session:
 * it fires the moment the agent opens or navigates the app.
 */
export function ForceLogout() {
  useEffect(() => {
    signOut({ callbackUrl: "/login" });
  }, []);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-[#fafafb] px-6 text-center text-gray-700">
      <LogOut className="h-8 w-8 text-red-500" />
      <p className="text-lg font-bold">Your account is no longer active</p>
      <p className="text-sm text-gray-500">Signing you out…</p>
    </div>
  );
}
