"use server";

import { signIn } from "@/lib/auth/auth";
import { registerSchema } from "@/lib/validations/auth";
import { createUser } from "@/modules/auth/services/auth.service";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";

export type SignupActionState = {
  error?: string;
  // Returned so the form can repopulate fields on error
  fields?: {
    name?: string;
    email?: string;
    role?: string;
    phone?: string;
    whatsapp?: string;
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
  };

  // Fields to echo back so the form doesn't wipe on error
  const fields = { name: raw.name, email: raw.email, role: raw.role, phone: raw.phone, whatsapp: raw.whatsapp };

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
    });
  } catch (err) {
    if (err instanceof Error && err.message === "EMAIL_TAKEN") {
      return { error: "An account with this email already exists.", fields };
    }
    console.error("[signupAction] createUser failed:", err);
    return { error: "Something went wrong. Please try again.", fields };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Account created but sign-in failed. Please log in manually.", fields };
    }
    throw err;
  }

  redirect("/admin");
}
