import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getSelfProfile } from "@/modules/users/services/users.service";
import { ProfileClient } from "./profile-client";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/admin/login");

  const profile = await getSelfProfile(session.user.id);
  if (!profile) redirect("/admin/login");

  return (
    <ProfileClient
      profile={{ ...profile, teamName: profile.team?.name ?? null }}
    />
  );
}
