"use server";

import { auth } from "@/lib/auth/auth";
import { revalidatePath } from "next/cache";
import {
  createForm,
  updateForm,
  softDeleteForm,
  softDeleteFormWithOrders,
  getFormOrderCounts,
  duplicateForm,
  getFormById,
  setFormDisabled,
} from "../services/forms.service";

import { isAdmin } from "@/lib/auth/role-routes";
import { logActivity } from "@/modules/audit/services/audit-log.service";
import { suppressCameraForRequest } from "@/lib/audit/context";

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
    suppressCameraForRequest();
    if (!name.trim()) return { error: "Form name is required" };
    const form = await createForm(actor.userId, name.trim(), data);
    await logActivity({
      userId: actor.userId, actorRole: actor.role,
      action: "Created", entityType: "Form", entityId: form.id,
      description: `Form ${name.trim()} created`,
    });
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
    suppressCameraForRequest();
    if (!name.trim()) return { error: "Form name is required" };
    await assertCanMutate(id, actor);
    await updateForm(id, name.trim(), data);
    await logActivity({
      userId: actor.userId, actorRole: actor.role,
      action: "Updated", entityType: "Form", entityId: id,
      description: `Form ${name.trim()} updated`,
    });
    revalidateForms();
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update form" };
  }
}

type DeleteFormResult =
  | { success: true }
  | { error: string }
  | { needsOrderConfirm: true; orderCount: number };

export async function deleteFormAction(
  id: string,
  confirmOrders = false,
): Promise<DeleteFormResult> {
  try {
    const actor = await requireFormActor();
    suppressCameraForRequest();
    await assertCanMutate(id, actor);

    const form = await getFormById(id);
    if (!form) return { error: "Form not found" };

    const { total, blocking } = await getFormOrderCounts(id);

    if (total === 0) {
      // No orders — plain soft delete (unchanged behaviour).
      await softDeleteForm(id);
    } else if (!isAdmin(actor.role)) {
      // A form with orders can't be deleted by media buyers — disable instead.
      return {
        error:
          "This form has orders, so it can't be deleted. Disable it instead to stop new orders.",
      };
    } else if (blocking > 0) {
      // Admin override is only safe when no order carries financial records.
      return {
        error: `This form has ${blocking} confirmed/delivered or invoiced order(s) with financial records, so it can't be deleted. Disable it instead.`,
      };
    } else if (!confirmOrders) {
      // Safe to delete, but the admin must acknowledge that the linked orders go too.
      return { needsOrderConfirm: true, orderCount: total };
    } else {
      // Admin confirmed — soft-delete the form and its non-financial orders together.
      await softDeleteFormWithOrders(id);
    }

    await logActivity({
      userId: actor.userId, actorRole: actor.role,
      action: "Deleted", entityType: "Form", entityId: id,
      description:
        total > 0
          ? `Form ${form.name} deleted with ${total} order(s)`
          : `Form ${form.name} deleted`,
    });
    revalidateForms();
    revalidatePath("/admin/orders");
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
    suppressCameraForRequest();
    await assertCanMutate(id, actor);
    await setFormDisabled(id, disabled);
    await logActivity({
      userId: actor.userId, actorRole: actor.role,
      action: "Updated", entityType: "Form", entityId: id,
      description: `Form ${disabled ? "disabled" : "enabled"}`,
    });
    revalidateForms();
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update form" };
  }
}

export async function duplicateFormAction(id: string): Promise<ActionResult> {
  try {
    const actor = await requireFormActor();
    suppressCameraForRequest();
    await assertCanMutate(id, actor);
    await duplicateForm(id, actor.userId);
    await logActivity({
      userId: actor.userId, actorRole: actor.role,
      action: "Created", entityType: "Form", entityId: id,
      description: `Form duplicated`,
    });
    revalidateForms();
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to duplicate form" };
  }
}
