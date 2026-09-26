"use server";

import { auth, signOut } from "@/lib/auth/auth";
import { forgetPushDevice } from "@/lib/notifications/push-device-cookie";

export async function logoutAction() {
  // Unregister this device's push alerts before the session goes (shared phones).
  await forgetPushDevice((await auth())?.user?.id);
  await signOut({ redirectTo: "/login" });
}
