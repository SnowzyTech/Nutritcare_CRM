import type { Metadata } from "next";
import { auth } from "@/lib/auth/auth";
import { getSelfProfile } from "@/modules/users/services/users.service";
import { formatDate, getInitials } from "@/lib/utils";
import { MediaBuyerTopbar } from "../_components/topbar";

export const metadata: Metadata = { title: "Settings" };

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm font-bold text-slate-800">{value || "—"}</p>
    </div>
  );
}

export default async function SettingsPage() {
  const session = await auth();
  const profile = session?.user?.id ? await getSelfProfile(session.user.id) : null;

  return (
    <div className="max-w-[900px] mx-auto pb-16">
      <MediaBuyerTopbar
        title="Settings"
        subtitle="Your media-buyer account details."
        showCreate={false}
      />

      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        <div className="flex items-center gap-5 mb-8">
          <div className="w-20 h-20 rounded-full bg-purple-100 overflow-hidden flex items-center justify-center text-2xl font-black text-purple-700">
            {profile?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <span>{getInitials(profile?.name ?? "")}</span>
            )}
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800">{profile?.name ?? "—"}</h3>
            <p className="text-sm text-slate-400">Media Buyer</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-slate-100 pt-8">
          <Field label="Full Name" value={profile?.name ?? ""} />
          <Field label="Email" value={profile?.email ?? ""} />
          <Field label="Phone" value={profile?.phone ?? ""} />
          <Field label="WhatsApp" value={profile?.whatsappNumber ?? ""} />
          <Field label="Member Since" value={profile?.createdAt ? formatDate(profile.createdAt) : ""} />
        </div>

        <p className="text-xs text-slate-400 mt-8">
          Profile editing and avatar upload can be enabled here in a later pass.
        </p>
      </div>
    </div>
  );
}
