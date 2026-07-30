import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';
import type { MediaBuyerProfile } from '@/modules/data-analysis/services/media-buyer-analysis.service';
import { DateRangeFilter } from '@/components/admin/date-range-filter';

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

/**
 * Shared header for a media buyer's sub-pages: who you're looking at, which
 * view, the window, and the date filter. `section` names the current view.
 */
export function MediaBuyerPageHeader({
  profile,
  section,
  periodLabel,
  showFilter = true,
}: {
  profile: MediaBuyerProfile;
  section: string;
  periodLabel: string;
  showFilter?: boolean;
}) {
  return (
    <div className="mb-8">
      <Link
        href={`/data/media-buyers/${profile.id}`}
        className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-purple-600 transition-colors mb-3"
      >
        <ChevronLeft size={14} /> Back to {profile.name.split(' ')[0]}
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border border-gray-100 bg-gray-100 shrink-0">
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt={profile.name}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                {initials(profile.name)}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-800">
              {profile.name}
              <span className="text-gray-400 font-bold"> / {section}</span>
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Showing <span className="font-semibold text-gray-600">{periodLabel}</span>
            </p>
          </div>
        </div>

        {showFilter && <DateRangeFilter defaultPreset="month" />}
      </div>
    </div>
  );
}
