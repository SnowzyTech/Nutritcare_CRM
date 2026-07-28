"use server";

import { signIn } from "@/lib/auth/auth";
import { loginSchema } from "@/lib/validations/auth";
import { getUserByEmail } from "@/modules/auth/services/auth.service";
import { isAdmin } from "@/lib/auth/role-routes";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export type AdminLoginActionState = {
  error?: string;
};

/**
 * Server action for admin-only sign-in.
 * Verifies credentials then enforces ADMIN role before creating a session.
 */
export async function adminLoginAction(
  _prevState: AdminLoginActionState,
  formData: FormData
): Promise<AdminLoginActionState> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  // Validate shape
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message;
    return { error: firstError ?? "Invalid input." };
  }

  // Check the user exists and is an admin (either tier) before we attempt signIn
  const user = await getUserByEmail(parsed.data.email);
  if (!user) {
    return { error: "Invalid email or password." };
  }
  if (!isAdmin(user.role)) {
    return { error: "Access denied. This portal is for administrators only." };
  }

  // Attempt credential sign-in
  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      switch (err.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password." };
        default:
          return { error: "Something went wrong. Please try again." };
      }
    }
    throw err;
  }

  redirect("/admin");
}
