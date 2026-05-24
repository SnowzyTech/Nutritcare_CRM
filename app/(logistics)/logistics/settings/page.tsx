import { auth } from "@/lib/auth/auth";
import { getSelfProfile } from "@/modules/users/services/users.service";
import { redirect } from "next/navigation";
import SettingsClient from "./settings-client";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profile = await getSelfProfile(session.user.id);
  if (!profile) redirect("/login");

  return <SettingsClient profile={profile} />;
}
