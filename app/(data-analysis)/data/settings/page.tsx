import { ProfileClient } from "./profile-client";
import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { getSelfProfile } from "@/modules/users/services/users.service";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profile = await getSelfProfile(session.user.id);
  if (!profile) redirect("/login");

  return <ProfileClient profile={profile} />;
}
