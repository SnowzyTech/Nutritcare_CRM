"use server";

import { auth, signIn, signOut } from "@/lib/auth/auth";
import { getRoleHome } from "@/lib/auth/role-routes";
import { loginSchema } from "@/lib/validations/auth";
import { getUserByEmail } from "@/modules/auth/services/auth.service";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export type LoginActionState = {
  error?: string;
};

export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message;
    return { error: firstError ?? "Invalid input." };
  }

  // Pre-check activation status for a clear error message
  const existing = await getUserByEmail(parsed.data.email);
  if (existing) {
    if (existing.accountActivationStatus === "PENDING") {
      return { error: "Your account is awaiting admin approval." };
    }
    if (existing.accountActivationStatus === "REJECTED") {
      return { error: "Your account request was rejected. Contact your admin." };
    }
  }

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

  const session = await auth();
  redirect(getRoleHome(session?.user?.role));
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
