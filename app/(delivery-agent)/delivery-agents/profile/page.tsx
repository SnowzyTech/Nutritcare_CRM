import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { getAgentProfile } from "@/modules/delivery/services/delivery-agent-portal.service";
import { ProfileClient } from "./profile-client";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profile = await getAgentProfile(session.user.id);
  if (!profile) redirect("/delivery-agents");

  const avatarUrl = profile.name
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=f3e8ff&color=ad1df4`
    : "https://ui-avatars.com/api/?name=Agent&background=f3e8ff&color=ad1df4";

  return <ProfileClient profile={profile} avatarUrl={avatarUrl} />;
}
