import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { isSuperAdmin } from "@/lib/auth/role-routes";
import { ADMIN_PAGES } from "@/lib/auth/admin-pages";
import { listAdmins } from "@/modules/users/services/users.service";
import { AdminAccessClient } from "./admins-client";

export const metadata: Metadata = { title: "Admins — Access Control" };

export default async function AdminsPage() {
  const session = await auth();
  if (!isSuperAdmin(session?.user?.role)) redirect("/admin");

  const admins = await listAdmins();

  return (
    <div className="max-w-[1100px] mx-auto font-inter text-slate-900 pb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900">Admins</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage limited-admin accounts and control which pages each one can access.
          Turn a page off to revoke access — the admin can no longer see or open it.
        </p>
      </div>

      {admins.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-400">
          No limited-admin accounts yet. Create one with{" "}
          <code className="text-slate-600">scripts/seed-limited-admin.ts</code>.
        </div>
      ) : (
        <AdminAccessClient
          admins={admins.map((a) => ({
            id: a.id,
            name: a.name,
            email: a.email,
            avatarUrl: a.avatarUrl,
            isActive: a.isActive,
            revokedAdminPages: a.revokedAdminPages,
          }))}
          pages={ADMIN_PAGES.map((p) => ({
            key: p.key,
            label: p.label,
            description: p.description,
          }))}
        />
      )}
    </div>
  );
}
