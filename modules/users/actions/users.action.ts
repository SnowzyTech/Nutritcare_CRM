"use server";

import { auth } from "@/lib/auth/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import {
  deleteUser,
  suspendUser,
  activateUser,
  updateUserPassword,
  toggleTeamLead,
  changeUserTeam,
  approveAccount,
  rejectAccount,
  assignWarehouseToUser,
  createTeam,
  deleteTeam,
  updateSelfProfile,
  setAccountingPermissions,
} from "../services/users.service";
import type { Department } from "@prisma/client";
import { isAdmin } from "@/lib/auth/role-routes";
import { ACCOUNTING_PERMISSION_KEYS } from "@/lib/auth/accounting-permissions";
import { canAccessAdminPage } from "@/lib/auth/admin-pages";
import { logActivity } from "@/modules/audit/services/audit-log.service";
import { suppressCameraForRequest } from "@/lib/audit/context";
import { prisma } from "@/lib/db/prisma";

type ActionResult = { success: true } | { error: string };
type ResetPasswordResult = { success: true; tempPassword: string } | { error: string };

/** Ensures the caller is an admin and returns their user id (the actor). */
async function requireAdmin(): Promise<{ id: string; name?: string | null; role?: string }> {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    throw new Error("Unauthorized");
  }
  return { id: session.user.id, name: session.user.name, role: session.user.role };
}

/** Look up a staff member's name for a human-readable audit description. */
async function staffName(userId: string): Promise<string> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  return u?.name ?? userId;
}

export async function updateProfileAction(input: {
  name: string;
  phone?: string;
  whatsappNumber?: string;
  avatarUrl?: string | null;
}): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };
    if (!input.name.trim()) return { error: "Name is required" };
    await updateSelfProfile(session.user.id, input);
    // Revalidate each role layout too, so the updated avatar/name reflects in
    // the sidebar/navbar (rendered in the layout), not just the settings page.
    revalidatePath("/admin", "layout");
    revalidatePath("/sales-rep", "layout");
    revalidatePath("/warehouse", "layout");
    revalidatePath("/accounting", "layout");
    revalidatePath("/logistics", "layout");
    revalidatePath("/inventory", "layout");
    revalidatePath("/data", "layout");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update profile" };
  }
}

export async function deleteUserAction(userId: string): Promise<ActionResult> {
  try {
    const actor = await requireAdmin();
    suppressCameraForRequest();
    const name = await staffName(userId);
    await deleteUser(userId);
    await logActivity({
      userId: actor.id, actorName: actor.name, actorRole: actor.role,
      action: "Deleted", entityType: "User", entityId: userId,
      description: `Deleted staff account ${name}`,
    });
    revalidatePath("/admin/staff", "layout");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete account" };
  }
}

export async function suspendUserAction(userId: string): Promise<ActionResult> {
  try {
    const actor = await requireAdmin();
    suppressCameraForRequest();
    const name = await staffName(userId);
    await suspendUser(userId);
    await logActivity({
      userId: actor.id, actorName: actor.name, actorRole: actor.role,
      action: "Suspended", entityType: "User", entityId: userId,
      description: `Suspended staff account ${name}`,
    });
    revalidatePath("/admin/staff", "layout");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to suspend account" };
  }
}

export async function activateUserAction(userId: string): Promise<ActionResult> {
  try {
    const actor = await requireAdmin();
    suppressCameraForRequest();
    const name = await staffName(userId);
    await activateUser(userId);
    await logActivity({
      userId: actor.id, actorName: actor.name, actorRole: actor.role,
      action: "Activated", entityType: "User", entityId: userId,
      description: `Reactivated staff account ${name}`,
    });
    revalidatePath("/admin/staff", "layout");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to activate account" };
  }
}

export async function resetUserPasswordAction(userId: string): Promise<ResetPasswordResult> {
  try {
    const actor = await requireAdmin();
    suppressCameraForRequest();
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let tempPassword = "Temp";
    for (let i = 0; i < 6; i++) {
      tempPassword += chars[Math.floor(Math.random() * chars.length)];
    }
    const hashed = await bcrypt.hash(tempPassword, 12);
    const name = await staffName(userId);
    await updateUserPassword(userId, hashed);
    await logActivity({
      userId: actor.id, actorName: actor.name, actorRole: actor.role,
      action: "Password Reset", entityType: "User", entityId: userId,
      description: `Reset password for ${name}`,
    });
    return { success: true, tempPassword };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to reset password" };
  }
}

export async function toggleTeamLeadAction(userId: string, makeTeamLead: boolean): Promise<ActionResult> {
  try {
    const actor = await requireAdmin();
    suppressCameraForRequest();
    const name = await staffName(userId);
    await toggleTeamLead(userId, makeTeamLead);
    await logActivity({
      userId: actor.id, actorName: actor.name, actorRole: actor.role,
      action: "Updated", entityType: "User", entityId: userId,
      description: `${makeTeamLead ? "Made" : "Removed"} team lead: ${name}`,
    });
    revalidatePath(`/admin/staff/sales-rep/${userId}`);
    revalidatePath("/admin/staff/sales-rep");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update team lead status" };
  }
}

/**
 * Admin sets which gated accounting features an accountant may see.
 * `permissions` is the full replacement list of granted feature keys.
 */
export async function updateAccountingPermissionsAction(input: {
  userId: string;
  permissions: string[];
}): Promise<ActionResult> {
  try {
    const actor = await requireAdmin();
    suppressCameraForRequest();

    // A super-admin can revoke a limited admin's authority to manage accounting
    // access (the "access-control" page key). Super-admins always pass.
    if (actor.role !== "SUPER_ADMIN") {
      const me = await prisma.user.findUnique({
        where: { id: actor.id },
        select: { revokedAdminPages: true },
      });
      if (!canAccessAdminPage(actor.role, me?.revokedAdminPages ?? [], "access-control")) {
        return { error: "You don't have permission to manage accounting access." };
      }
    }

    // Keep only valid keys (drops anything unknown; also de-dupes).
    const valid = Array.from(
      new Set(input.permissions.filter((p) => (ACCOUNTING_PERMISSION_KEYS as string[]).includes(p)))
    );

    const result = await setAccountingPermissions(input.userId, valid);
    if (result.count === 0) return { error: "Accountant not found." };

    const name = await staffName(input.userId);
    await logActivity({
      userId: actor.id, actorName: actor.name, actorRole: actor.role,
      action: "Updated", entityType: "User", entityId: input.userId,
      description: valid.length > 0
        ? `Set accounting access for ${name}: ${valid.join(", ")}`
        : `Removed all accounting access for ${name}`,
    });

    revalidatePath(`/admin/staff/accountant/${input.userId}`);
    revalidatePath("/admin/staff/admins");
    revalidatePath("/accounting", "layout");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update accounting access" };
  }
}

export async function changeTeamAction(userId: string, teamId: string | null): Promise<ActionResult> {
  try {
    const actor = await requireAdmin();
    suppressCameraForRequest();
    const name = await staffName(userId);
    await changeUserTeam(userId, teamId);
    await logActivity({
      userId: actor.id, actorName: actor.name, actorRole: actor.role,
      action: "Updated", entityType: "User", entityId: userId,
      description: `Changed team for ${name}`,
    });
    revalidatePath(`/admin/staff/sales-rep/${userId}`);
    revalidatePath("/admin/staff/sales-rep");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to change team" };
  }
}

export async function approveAccountAction(userId: string): Promise<ActionResult> {
  try {
    const actor = await requireAdmin();
    suppressCameraForRequest();
    const name = await staffName(userId);
    await approveAccount(userId);
    await logActivity({
      userId: actor.id, actorName: actor.name, actorRole: actor.role,
      action: "Approved", entityType: "User", entityId: userId,
      description: `Approved account ${name}`,
    });
    revalidatePath("/admin/staff/manage-account");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to approve account" };
  }
}

export async function rejectAccountAction(userId: string): Promise<ActionResult> {
  try {
    const actor = await requireAdmin();
    suppressCameraForRequest();
    const name = await staffName(userId);
    await rejectAccount(userId);
    await logActivity({
      userId: actor.id, actorName: actor.name, actorRole: actor.role,
      action: "Rejected", entityType: "User", entityId: userId,
      description: `Rejected account ${name}`,
    });
    revalidatePath("/admin/staff/manage-account");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to reject account" };
  }
}

export async function assignWarehouseAction(userId: string, warehouseId: string | null): Promise<ActionResult> {
  try {
    const actor = await requireAdmin();
    suppressCameraForRequest();
    const name = await staffName(userId);
    await assignWarehouseToUser(userId, warehouseId);
    await logActivity({
      userId: actor.id, actorName: actor.name, actorRole: actor.role,
      action: "Updated", entityType: "User", entityId: userId,
      description: `Assigned warehouse to ${name}`,
    });
    revalidatePath(`/admin/staff/warehouse-manager/${userId}`);
    revalidatePath("/admin/staff/warehouse-manager");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to assign warehouse" };
  }
}

export async function createTeamAction(name: string, department: Department): Promise<ActionResult> {
  try {
    const actor = await requireAdmin();
    suppressCameraForRequest();
    if (!name.trim()) return { error: "Team name is required" };
    const created = await createTeam(name, department);
    await logActivity({
      userId: actor.id, actorName: actor.name, actorRole: actor.role,
      action: "Created", entityType: "Team",
      entityId: (created as { id?: string })?.id ?? name,
      description: `Created team ${name} (${department})`,
    });
    revalidatePath("/admin/staff/teams");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create team" };
  }
}

export async function deleteTeamAction(id: string): Promise<ActionResult> {
  try {
    const actor = await requireAdmin();
    suppressCameraForRequest();
    await deleteTeam(id);
    await logActivity({
      userId: actor.id, actorName: actor.name, actorRole: actor.role,
      action: "Deleted", entityType: "Team", entityId: id,
      description: `Deleted a team`,
    });
    revalidatePath("/admin/staff/teams");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete team" };
  }
}
