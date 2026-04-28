import { ProfileClient } from "./profile-client";
import { auth } from "@/lib/auth/auth";

export default async function ProfilePage() {
  const session = await auth();
  const user = session?.user;

  return (
    <ProfileClient
      initialName={user?.name ?? ""}
      initialEmail={user?.email ?? ""}
      initialRole={user?.role ?? "DATA_ANALYST"}
    />
  );
}
