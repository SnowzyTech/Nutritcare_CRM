"use server";

import { auth } from "@/lib/auth/auth";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth/role-routes";
import { markFailedAttemptRecovered } from "../services/failed-attempt.service";

type ActionResult = { success: true } | { error: string };

/** Admin-only: mark a failed order attempt as recovered (rep has followed up). */
export async function markFailedAttemptRecoveredAction(id: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id || !isAdmin(session.user.role)) {
      return { error: "Unauthorized" };
    }
    if (!id) return { error: "Missing id" };
    await markFailedAttemptRecovered(id);
    revalidatePath("/admin/orders/failed-attempts");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update" };
  }
}
