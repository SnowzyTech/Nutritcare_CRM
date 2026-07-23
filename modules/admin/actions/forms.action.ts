"use server";

import { auth } from "@/lib/auth/auth";
import { revalidatePath } from "next/cache";
import {
  createForm,
  updateForm,
  softDeleteForm,
  duplicateForm,
  getFormById,
  setFormDisabled,
} from "../services/forms.service";

import { isAdmin } from "@/lib/auth/role-routes";

type ActionResult = { success: true } | { error: string };
type CreateResult = { success: true; id: string } | { error: string };

type Actor = { userId: string; role: "SUPER_ADMIN" | "ADMIN" | "MEDIA_BUYER" };

/** Both admins (either tier) and media buyers may manage forms; everyone else is rejected. */
async function requireFormActor(): Promise<Actor> {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user?.id || (!isAdmin(role) && role !== "MEDIA_BUYER")) {
    throw new Error("Unauthorized");
  }
  return { userId: session.user.id, role: role as Actor["role"] };
}

/** A media buyer may only mutate their own forms; an admin (either tier) may mutate any. */
async function assertCanMutate(id: string, actor: Actor) {
  if (isAdmin(actor.role)) return;
  const form = await getFormById(id);
  if (!form || form.createdById !== actor.userId) throw new Error("Unauthorized");
}

function revalidateForms() {
  revalidatePath("/admin/forms");
  revalidatePath("/media-buyer/forms");
}

export async function createFormAction(
  name: string,
  data: Record<string, unknown>
): Promise<CreateResult> {
  try {
    const actor = await requireFormActor();
    if (!name.trim()) return { error: "Form name is required" };
    const form = await createForm(actor.userId, name.trim(), data);
    revalidateForms();
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
    const actor = await requireFormActor();
    if (!name.trim()) return { error: "Form name is required" };
    await assertCanMutate(id, actor);
    await updateForm(id, name.trim(), data);
    revalidateForms();
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update form" };
  }
}

export async function deleteFormAction(id: string): Promise<ActionResult> {
  try {
    const actor = await requireFormActor();
    await assertCanMutate(id, actor);
    await softDeleteForm(id);
    revalidateForms();
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete form" };
  }
}

export async function setFormDisabledAction(
  id: string,
  disabled: boolean
): Promise<ActionResult> {
  try {
    const actor = await requireFormActor();
    await assertCanMutate(id, actor);
    await setFormDisabled(id, disabled);
    revalidateForms();
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update form" };
  }
}

export async function duplicateFormAction(id: string): Promise<ActionResult> {
  try {
    const actor = await requireFormActor();
    await assertCanMutate(id, actor);
    await duplicateForm(id, actor.userId);
    revalidateForms();
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to duplicate form" };
  }
}
