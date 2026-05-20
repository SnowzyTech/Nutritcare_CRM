import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { getSelfProfile } from "@/modules/users/services/users.service";
import { AccountingSettingsClient } from "./settings-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

export default async function AccountingSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profile = await getSelfProfile(session.user.id);
  if (!profile) redirect("/login");

  return (
    <div className="p-8 pb-20">
      <AccountingSettingsClient profile={profile} />
    </div>
  );
}
