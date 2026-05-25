"use server";

import { auth } from "@/lib/auth/auth";
import { revalidatePath } from "next/cache";
import {
  createForm,
  updateForm,
  softDeleteForm,
  duplicateForm,
} from "../services/forms.service";

type ActionResult = { success: true } | { error: string };
type CreateResult = { success: true; id: string } | { error: string };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") throw new Error("Unauthorized");
  return session.user.id;
}

export async function createFormAction(
  name: string,
  data: Record<string, unknown>
): Promise<CreateResult> {
  try {
    const userId = await requireAdmin();
    if (!name.trim()) return { error: "Form name is required" };
    const form = await createForm(userId, name.trim(), data);
    revalidatePath("/admin/forms");
    return { success: true, id: form.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create form" };
  }
}

export async function updateFormAction(
  id: string,
  name: string,
  data: Record<string, unknown>
): Promise<ActionResult> {
  try {
    await requireAdmin();
    if (!name.trim()) return { error: "Form name is required" };
    await updateForm(id, name.trim(), data);
    revalidatePath("/admin/forms");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update form" };
  }
}

export async function deleteFormAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await softDeleteForm(id);
    revalidatePath("/admin/forms");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete form" };
  }
}

export async function duplicateFormAction(id: string): Promise<ActionResult> {
  try {
    const userId = await requireAdmin();
    await duplicateForm(id, userId);
    revalidatePath("/admin/forms");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to duplicate form" };
  }
}
