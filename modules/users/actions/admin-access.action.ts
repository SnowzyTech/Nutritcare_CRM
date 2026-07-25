"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { isSuperAdmin } from "@/lib/auth/role-routes";
import { ADMIN_PAGE_KEYS } from "@/lib/auth/admin-pages";
import { setAdminPageAccess } from "../services/users.service";
import { logActivity } from "@/modules/audit/services/audit-log.service";
import { suppressCameraForRequest } from "@/lib/audit/context";

type ActionResult = { success: true } | { error: string };

const schema = z.object({
  userId: z.string().min(1),
  revokedPages: z.array(z.enum(ADMIN_PAGE_KEYS as [string, ...string[]])),
});

/**
 * SUPER_ADMIN sets which pages a limited admin may NOT access.
 * `revokedPages` is the full replacement list of revoked page keys.
 */
export async function updateAdminPageAccessAction(input: {
  userId: string;
  revokedPages: string[];
}): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id || !isSuperAdmin(session.user.role)) {
      return { error: "Unauthorized" };
    }

    suppressCameraForRequest();

    const parsed = schema.safeParse(input);
    if (!parsed.success) return { error: "Invalid input." };

    const result = await setAdminPageAccess(parsed.data.userId, parsed.data.revokedPages);
    if (result.count === 0) return { error: "Admin not found." };

    await logActivity({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "User",
      entityId: parsed.data.userId,
      description:
        parsed.data.revokedPages.length > 0
          ? `Revoked admin page access: ${parsed.data.revokedPages.join(", ")}`
          : "Restored full admin page access",
    });

    revalidatePath("/admin/staff/admins");
    revalidatePath("/admin", "layout");
    return { success: true };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}
