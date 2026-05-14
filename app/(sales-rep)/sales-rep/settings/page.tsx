import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { getSelfProfile } from "@/modules/users/services/users.service";
import { ProfileClient } from "./profile-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

export default async function SalesRepSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profile = await getSelfProfile(session.user.id);
  if (!profile) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto space-y-8 pt-2 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Manage your profile information.</p>
      </div>
      <ProfileClient profile={profile} />
    </div>
  );
}
