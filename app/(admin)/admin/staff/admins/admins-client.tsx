"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Users,
  ShoppingCart,
  Package,
  FileText,
  History,
  MessageCircle,
  ShieldCheck,
  ShieldOff,
  KeyRound,
  Ban,
  CheckCircle2,
  Copy,
  X,
  type LucideIcon,
} from "lucide-react";
import { updateAdminPageAccessAction } from "@/modules/users/actions/admin-access.action";
import {
  suspendUserAction,
  activateUserAction,
  resetUserPasswordAction,
} from "@/modules/users/actions/users.action";

type AdminRow = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  isActive: boolean;
  revokedAdminPages: string[];
};

type PageDef = { key: string; label: string; description: string };

const PAGE_ICONS: Record<string, LucideIcon> = {
  staff: Users,
  orders: ShoppingCart,
  inventory: Package,
  forms: FileText,
  history: History,
  chat: MessageCircle,
};

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AdminAccessClient({
  admins,
  pages,
}: {
  admins: AdminRow[];
  pages: PageDef[];
}) {
  return (
    <div className="space-y-6">
      {admins.map((admin) => (
        <AdminCard key={admin.id} admin={admin} pages={pages} />
      ))}
    </div>
  );
}

// ── Confirmation dialog descriptor ───────────────────────────────────────────
type Dialog =
  | { kind: "toggle"; pageKey: string; pageLabel: string; grant: boolean }
  | { kind: "grantAll" }
  | { kind: "restrictAll" }
  | { kind: "suspend" }
  | { kind: "activate" };

function AdminCard({ admin, pages }: { admin: AdminRow; pages: PageDef[] }) {
  const allKeys = useMemo(() => pages.map((p) => p.key), [pages]);
  const [revoked, setRevoked] = useState<string[]>(admin.revokedAdminPages);
  const [isActive, setIsActive] = useState<boolean>(admin.isActive);
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const enabledCount = allKeys.length - revoked.length;
  const fullAccess = revoked.length === 0;

  // ── Persist a new revoked-pages list ──────────────────────────────────────
  function applyRevoked(next: string[], successMsg: string) {
    const previous = revoked;
    setRevoked(next);
    startTransition(async () => {
      const res = await updateAdminPageAccessAction({
        userId: admin.id,
        revokedPages: next,
      });
      if ("error" in res) {
        setRevoked(previous); // rollback
        toast.error(res.error);
      } else {
        toast.success(successMsg);
      }
    });
  }

  function onConfirm() {
    if (!dialog) return;
    const d = dialog;
    setDialog(null);

    switch (d.kind) {
      case "toggle": {
        const next = d.grant
          ? revoked.filter((k) => k !== d.pageKey)
          : [...revoked, d.pageKey];
        applyRevoked(
          next,
          d.grant
            ? `${d.pageLabel} access granted to ${admin.name}`
            : `${d.pageLabel} access revoked from ${admin.name}`
        );
        break;
      }
      case "grantAll":
        applyRevoked([], `${admin.name} now has full access`);
        break;
      case "restrictAll":
        applyRevoked([...allKeys], `All pages restricted for ${admin.name}`);
        break;
      case "suspend":
        startTransition(async () => {
          const res = await suspendUserAction(admin.id);
          if ("error" in res) toast.error(res.error);
          else {
            setIsActive(false);
            toast.success(`${admin.name} suspended`);
          }
        });
        break;
      case "activate":
        startTransition(async () => {
          const res = await activateUserAction(admin.id);
          if ("error" in res) toast.error(res.error);
          else {
            setIsActive(true);
            toast.success(`${admin.name} reactivated`);
          }
        });
        break;
    }
  }

  function onResetPassword() {
    startTransition(async () => {
      const res = await resetUserPasswordAction(admin.id);
      if ("error" in res) toast.error(res.error);
      else {
        setTempPassword(res.tempPassword);
        toast.success("Temporary password generated");
      }
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center gap-3.5 mb-5">
        {admin.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={admin.avatarUrl}
            alt={admin.name}
            className="w-11 h-11 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center text-white text-sm font-black shrink-0">
            {initials(admin.name)}
          </div>
        )}
        <div className="leading-tight mr-auto">
          <div className="flex items-center gap-2">
            <p className="text-[0.95rem] font-black text-slate-900">{admin.name}</p>
            {isActive ? (
              <span className="text-[0.65rem] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Active
              </span>
            ) : (
              <span className="text-[0.65rem] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                Suspended
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">{admin.email}</p>
        </div>

        {/* Access summary */}
        <span
          className={`text-[0.7rem] font-bold px-3 py-1.5 rounded-full ${
            fullAccess
              ? "text-emerald-700 bg-emerald-50"
              : "text-slate-600 bg-slate-100"
          }`}
        >
          {fullAccess
            ? "Full access"
            : `${enabledCount} of ${allKeys.length} pages`}
        </span>
      </div>

      {/* ── Management actions ── */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          type="button"
          disabled={pending || fullAccess}
          onClick={() => setDialog({ kind: "grantAll" })}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 px-3 py-2 rounded-lg transition-colors"
        >
          <ShieldCheck size={14} /> Grant full access
        </button>
        <button
          type="button"
          disabled={pending || revoked.length === allKeys.length}
          onClick={() => setDialog({ kind: "restrictAll" })}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 px-3 py-2 rounded-lg transition-colors"
        >
          <ShieldOff size={14} /> Restrict all
        </button>
        <div className="w-px bg-slate-200 mx-1" />
        {isActive ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => setDialog({ kind: "suspend" })}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 disabled:opacity-40 px-3 py-2 rounded-lg transition-colors"
          >
            <Ban size={14} /> Suspend
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => setDialog({ kind: "activate" })}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 px-3 py-2 rounded-lg transition-colors"
          >
            <CheckCircle2 size={14} /> Reactivate
          </button>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={onResetPassword}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 disabled:opacity-40 px-3 py-2 rounded-lg transition-colors"
        >
          <KeyRound size={14} /> Reset password
        </button>
      </div>

      {/* ── Page access rows ── */}
      <div className="space-y-2">
        {pages.map((page) => {
          const hasAccess = !revoked.includes(page.key);
          const Icon = PAGE_ICONS[page.key] ?? FileText;
          return (
            <div
              key={page.key}
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-slate-100 bg-slate-50/50"
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  hasAccess ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-400"
                }`}
              >
                <Icon size={16} />
              </div>
              <div className="min-w-0 mr-auto">
                <p className="text-[0.85rem] font-bold text-slate-800">{page.label}</p>
                <p className="text-xs text-slate-400 truncate">{page.description}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={hasAccess}
                aria-label={`${hasAccess ? "Revoke" : "Grant"} ${page.label} access`}
                disabled={pending}
                onClick={() =>
                  setDialog({
                    kind: "toggle",
                    pageKey: page.key,
                    pageLabel: page.label,
                    grant: !hasAccess,
                  })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                  hasAccess ? "bg-emerald-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    hasAccess ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Confirmation modal ── */}
      {dialog && (
        <ConfirmModal
          admin={admin}
          dialog={dialog}
          pending={pending}
          onCancel={() => setDialog(null)}
          onConfirm={onConfirm}
        />
      )}

      {/* ── Temp password result modal ── */}
      {tempPassword && (
        <TempPasswordModal
          adminName={admin.name}
          password={tempPassword}
          onClose={() => setTempPassword(null)}
        />
      )}
    </div>
  );
}

// ── Confirmation modal ────────────────────────────────────────────────────────
function ConfirmModal({
  admin,
  dialog,
  pending,
  onCancel,
  onConfirm,
}: {
  admin: AdminRow;
  dialog: Dialog;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { title, body, confirmLabel, danger } = describe(dialog, admin.name);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-black text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">{body}</p>
        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={`px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-60 ${
              danger
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function describe(dialog: Dialog, name: string) {
  switch (dialog.kind) {
    case "toggle":
      return dialog.grant
        ? {
            title: `Grant ${dialog.pageLabel} access?`,
            body: `${name} will be able to view and open the ${dialog.pageLabel} page.`,
            confirmLabel: "Grant access",
            danger: false,
          }
        : {
            title: `Revoke ${dialog.pageLabel} access?`,
            body: `${name} will no longer see or be able to open the ${dialog.pageLabel} page.`,
            confirmLabel: "Revoke access",
            danger: true,
          };
    case "grantAll":
      return {
        title: "Grant full access?",
        body: `${name} will be able to access every admin page.`,
        confirmLabel: "Grant full access",
        danger: false,
      };
    case "restrictAll":
      return {
        title: "Restrict all pages?",
        body: `${name} will lose access to every admin page except the Dashboard.`,
        confirmLabel: "Restrict all",
        danger: true,
      };
    case "suspend":
      return {
        title: "Suspend this admin?",
        body: `${name} will not be able to sign in until reactivated.`,
        confirmLabel: "Suspend",
        danger: true,
      };
    case "activate":
      return {
        title: "Reactivate this admin?",
        body: `${name} will be able to sign in again.`,
        confirmLabel: "Reactivate",
        danger: false,
      };
  }
}

// ── Temp password modal ───────────────────────────────────────────────────────
function TempPasswordModal({
  adminName,
  password,
  onClose,
}: {
  adminName: string;
  password: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          aria-label="Close"
        >
          <X size={18} />
        </button>
        <h3 className="text-lg font-black text-slate-900">Temporary password</h3>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          Share this one-time password with {adminName}. They should change it after
          signing in. It won&apos;t be shown again.
        </p>
        <div className="flex items-center gap-2 mt-4">
          <code className="flex-1 px-3 py-2.5 rounded-lg bg-slate-100 text-slate-800 font-mono text-sm break-all">
            {password}
          </code>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(password);
              setCopied(true);
              toast.success("Copied to clipboard");
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
          >
            <Copy size={14} /> {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
