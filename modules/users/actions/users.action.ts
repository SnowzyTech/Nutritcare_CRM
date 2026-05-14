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
} from "../services/users.service";
import type { Department } from "@prisma/client";

type ActionResult = { success: true } | { error: string };
type ResetPasswordResult = { success: true; tempPassword: string } | { error: string };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

export async function updateProfileAction(input: {
  name: string;
  phone?: string;
  whatsappNumber?: string;
}): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };
    if (!input.name.trim()) return { error: "Name is required" };
    await updateSelfProfile(session.user.id, input);
    revalidatePath("/sales-rep/settings");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update profile" };
  }
}

export async function deleteUserAction(userId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await deleteUser(userId);
    revalidatePath("/admin/staff", "layout");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete account" };
  }
}

export async function suspendUserAction(userId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await suspendUser(userId);
    revalidatePath("/admin/staff", "layout");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to suspend account" };
  }
}

export async function activateUserAction(userId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await activateUser(userId);
    revalidatePath("/admin/staff", "layout");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to activate account" };
  }
}

export async function resetUserPasswordAction(userId: string): Promise<ResetPasswordResult> {
  try {
    await requireAdmin();
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let tempPassword = "Temp";
    for (let i = 0; i < 6; i++) {
      tempPassword += chars[Math.floor(Math.random() * chars.length)];
    }
    const hashed = await bcrypt.hash(tempPassword, 12);
    await updateUserPassword(userId, hashed);
    return { success: true, tempPassword };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to reset password" };
  }
}

export async function toggleTeamLeadAction(userId: string, makeTeamLead: boolean): Promise<ActionResult> {
  try {
    await requireAdmin();
    await toggleTeamLead(userId, makeTeamLead);
    revalidatePath(`/admin/staff/sales-rep/${userId}`);
    revalidatePath("/admin/staff/sales-rep");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update team lead status" };
  }
}

export async function changeTeamAction(userId: string, teamId: string | null): Promise<ActionResult> {
  try {
    await requireAdmin();
    await changeUserTeam(userId, teamId);
    revalidatePath(`/admin/staff/sales-rep/${userId}`);
    revalidatePath("/admin/staff/sales-rep");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to change team" };
  }
}

export async function approveAccountAction(userId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await approveAccount(userId);
    revalidatePath("/admin/staff/manage-account");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to approve account" };
  }
}

export async function rejectAccountAction(userId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await rejectAccount(userId);
    revalidatePath("/admin/staff/manage-account");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to reject account" };
  }
}

export async function assignWarehouseAction(userId: string, warehouseId: string | null): Promise<ActionResult> {
  try {
    await requireAdmin();
    await assignWarehouseToUser(userId, warehouseId);
    revalidatePath(`/admin/staff/warehouse-manager/${userId}`);
    revalidatePath("/admin/staff/warehouse-manager");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to assign warehouse" };
  }
}

export async function createTeamAction(name: string, department: Department): Promise<ActionResult> {
  try {
    await requireAdmin();
    if (!name.trim()) return { error: "Team name is required" };
    await createTeam(name, department);
    revalidatePath("/admin/staff/teams");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create team" };
  }
}

export async function deleteTeamAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await deleteTeam(id);
    revalidatePath("/admin/staff/teams");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete team" };
  }
}
