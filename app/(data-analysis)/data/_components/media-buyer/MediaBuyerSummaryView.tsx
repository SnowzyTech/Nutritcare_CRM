import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Mail, MessageCircle, Phone, Users } from 'lucide-react';
import type {
  MediaBuyerAnalytics,
  MediaBuyerProfile,
} from '@/modules/data-analysis/services/media-buyer-analysis.service';
import { formatDate } from '@/lib/utils';
import { FunnelBar, MediaBuyerKpiCard } from './MediaBuyerKpiCard';
import { MediaBuyerFormsTable } from './MediaBuyerFormsTable';

const STATUS_DOTS: Record<string, string> = {
  Pending: 'bg-yellow-400',
  Confirmed: 'bg-emerald-400',
  Delivered: 'bg-emerald-600',
  Cancelled: 'bg-rose-300',
  Failed: 'bg-rose-600',
};

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

/**
 * A media buyer's landing page for the analyst — the counterpart to
 * SalesRepSummaryClient: identity, lead mix, contact details, an analytics
 * preview and a top-forms preview, each linking to its full view. No
 * interactivity, so this stays a server component.
 */
export function MediaBuyerSummaryView({
  profile,
  analytics,
  periodLabel,
}: {
  profile: MediaBuyerProfile;
  analytics: MediaBuyerAnalytics;
  periodLabel: string;
}) {
  const base = `/data/media-buyers/${profile.id}`;
  const { metrics, funnel, leadStatuses, forms } = analytics;
  const funnelMax = Math.max(funnel.views, funnel.leads, funnel.delivered, 1);
  const totalLeads = leadStatuses.reduce((s, l) => s + l.count, 0);

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="relative w-14 h-14 rounded-full overflow-hidden border border-gray-100 bg-gray-100 shrink-0">
          {profile.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt={profile.name}
              fill
              className="object-cover"
              sizes="56px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-500">
              {initials(profile.name)}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-800">
            {profile.name}
            <span className="text-gray-400 font-bold"> / Media Buyer</span>
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Showing <span className="font-semibold text-gray-600">{periodLabel}</span>
            {!profile.isActive && (
              <span className="ml-2 inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                Inactive
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Leads */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-gray-800">Leads</h2>
          <Link
            href={`${base}/leads`}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl px-4 py-2 transition-colors"
          >
            See All Leads <ArrowRight size={15} />
          </Link>
        </div>
        <div className="flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-2 rounded-xl bg-[#A020F0] text-white px-4 py-2.5 text-sm font-bold shadow-lg shadow-purple-200">
            All <span className="opacity-80">{totalLeads.toLocaleString()}</span>
          </span>
          {leadStatuses.map((status) => (
            <span
              key={status.status}
              className="inline-flex items-center gap-2 rounded-xl bg-white border border-gray-50 shadow-sm px-4 py-2.5 text-sm font-medium text-gray-600"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${STATUS_DOTS[status.label] ?? 'bg-gray-300'}`}
              />
              {status.label}
              <span className="font-bold text-gray-800">{status.count.toLocaleString()}</span>
            </span>
          ))}
        </div>
      </section>

      {/* Profile */}
      <section>
        <h2 className="text-lg font-black text-gray-800 mb-4">Profile</h2>
        <div className="bg-white rounded-2xl border border-gray-50 shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <ProfileField icon={<Phone size={14} />} label="Phone" value={profile.phone} />
            <ProfileField
              icon={<MessageCircle size={14} />}
              label="WhatsApp"
              value={profile.whatsapp}
            />
            <ProfileField icon={<Mail size={14} />} label="Email" value={profile.email} />
            <ProfileField icon={<Users size={14} />} label="Team" value={profile.teamName} />
          </div>
          <p className="text-[11px] text-gray-400 mt-5 pt-4 border-t border-gray-50">
            Joined {formatDate(profile.joinedAt)} · {metrics.totalForms.toLocaleString()} form
            {metrics.totalForms === 1 ? '' : 's'} created all-time
          </p>
        </div>
      </section>

      {/* Analytics preview */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-gray-800">Analytics</h2>
          <Link
            href={`${base}/analytics`}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl px-4 py-2 transition-colors"
          >
            See Full Analytics <ArrowRight size={15} />
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MediaBuyerKpiCard
              label="Conversion"
              value={`${metrics.conversion.value}%`}
              metric={metrics.conversion}
              highlight
            />
            <MediaBuyerKpiCard
              label="Leads"
              value={metrics.leads.value}
              metric={metrics.leads}
            />
            <MediaBuyerKpiCard
              label="Delivered"
              value={metrics.delivered.value}
              metric={metrics.delivered}
            />
          </div>
          <div className="bg-white rounded-2xl border border-gray-50 shadow-sm p-5">
            <p className="text-sm font-black text-gray-800 mb-4">Conversion Funnel</p>
            <div className="space-y-4">
              <FunnelBar label="Views" value={funnel.views} max={funnelMax} color="#cbd5e1" />
              <FunnelBar label="Leads" value={funnel.leads} max={funnelMax} color="#f59e0b" />
              <FunnelBar
                label="Delivered"
                value={funnel.delivered}
                max={funnelMax}
                color="#22c55e"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Forms preview */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-gray-800">Top Forms</h2>
          <Link
            href={`${base}/forms`}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl px-4 py-2 transition-colors"
          >
            See All Forms <ArrowRight size={15} />
          </Link>
        </div>
        <MediaBuyerFormsTable forms={forms} hrefBase={`${base}/forms`} limit={5} />
      </section>
    </div>
  );
}

function ProfileField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
        {icon} {label}
      </span>
      <p className="text-sm font-semibold text-gray-800 mt-1.5 truncate">
        {value || <span className="text-gray-300">—</span>}
      </p>
    </div>
  );
}
