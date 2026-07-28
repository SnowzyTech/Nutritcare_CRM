import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { isAdmin, isSuperAdmin } from "@/lib/auth/role-routes";
import { requireAdminPageAccess } from "@/lib/auth/guard-admin-page";
import { ADMIN_PAGES } from "@/lib/auth/admin-pages";
import { ACCOUNTING_PERMISSIONS } from "@/lib/auth/accounting-permissions";
import { listAdmins, listAccountantsForAccess } from "@/modules/users/services/users.service";
import { AdminAccessClient } from "./admins-client";
import { AccountingAccessClient } from "./accounting-access-client";

export const metadata: Metadata = { title: "Access Control" };

export default async function AdminsPage() {
  const session = await auth();
  const role = session?.user?.role;
  // Any admin can manage Accounting Access; the Admin Access section below is
  // additionally gated to SUPER_ADMIN.
  if (!isAdmin(role)) redirect("/admin");
  // A limited admin's authority to manage accounting access is itself revocable
  // by a super-admin (the "access-control" page key). Super-admins bypass.
  await requireAdminPageAccess("access-control");
  const superAdmin = isSuperAdmin(role);

  const [admins, accountants] = await Promise.all([
    superAdmin ? listAdmins() : Promise.resolve([]),
    listAccountantsForAccess(),
  ]);

  return (
    <div className="max-w-[1100px] mx-auto font-inter text-slate-900 pb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900">Access Control</h1>
        <p className="text-sm text-slate-500 mt-1">
          Control what each staff member can access. Turn a capability off to revoke it —
          they can no longer see or open it.
        </p>
      </div>

      {/* ── Admin page access (SUPER_ADMIN only) ── */}
      {superAdmin && (
        <section className="mb-12">
          <h2 className="text-lg font-black text-slate-800 mb-1">Admin Access</h2>
          <p className="text-sm text-slate-500 mb-5">Which pages each limited-admin account can open.</p>
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
        </section>
      )}

      {/* ── Accounting access ── */}
      <section>
        <h2 className="text-lg font-black text-slate-800 mb-1">Accounting Access</h2>
        <p className="text-sm text-slate-500 mb-5">
          Grant an accountant the head-of-accounting features. Normal accountants see none of these.
        </p>
        <AccountingAccessClient
          accountants={accountants.map((a) => ({
            id: a.id,
            name: a.name,
            email: a.email,
            avatarUrl: a.avatarUrl,
            isActive: a.isActive,
            accountingPermissions: a.accountingPermissions,
          }))}
          features={ACCOUNTING_PERMISSIONS.map((f) => ({
            key: f.key,
            label: f.label,
            description: f.description,
          }))}
        />
      </section>
    </div>
  );
}
