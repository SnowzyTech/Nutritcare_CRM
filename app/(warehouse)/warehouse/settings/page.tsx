import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { getSelfProfile } from "@/modules/users/services/users.service";
import { SettingsClient } from "./settings-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profile = await getSelfProfile(session.user.id);
  if (!profile) redirect("/login");

  return (
    <div className="w-full pb-20">
      <SettingsClient profile={profile} />
    </div>
  );
}
