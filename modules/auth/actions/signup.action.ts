"use server";

import { registerSchema } from "@/lib/validations/auth";
import { createUser } from "@/modules/auth/services/auth.service";
import type { UserRole } from "@prisma/client";

export type SignupActionState = {
  error?: string;
  pendingApproval?: boolean;
  fields?: {
    name?: string;
    email?: string;
    role?: string;
    phone?: string;
    whatsapp?: string;
    avatarUrl?: string;
    warehouseId?: string;
    teamId?: string;
  };
};

export async function signupAction(
  _prevState: SignupActionState,
  formData: FormData
): Promise<SignupActionState> {
  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
    role: formData.get("role") as string,
    phone: (formData.get("phone") as string) || undefined,
    whatsapp: (formData.get("whatsapp") as string) || undefined,
    avatarUrl: (formData.get("avatarUrl") as string) || undefined,
    warehouseId: (formData.get("warehouseId") as string) || undefined,
    teamId: (formData.get("teamId") as string) || undefined,
  };

  const fields = {
    name: raw.name,
    email: raw.email,
    role: raw.role,
    phone: raw.phone,
    whatsapp: raw.whatsapp,
    avatarUrl: raw.avatarUrl,
    warehouseId: raw.warehouseId,
    teamId: raw.teamId,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message;
    return { error: firstError ?? "Invalid input.", fields };
  }

  try {
    await createUser({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
      role: parsed.data.role as UserRole,
      phone: parsed.data.phone,
      whatsapp: parsed.data.whatsapp,
      avatarUrl: parsed.data.avatarUrl || undefined,
      warehouseId: parsed.data.warehouseId || undefined,
      teamId: parsed.data.teamId || undefined,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "EMAIL_TAKEN") {
      return { error: "An account with this email already exists.", fields };
    }
    console.error("[signupAction] createUser failed:", err);
    return { error: "Something went wrong. Please try again.", fields };
  }

  return { pendingApproval: true };
}
