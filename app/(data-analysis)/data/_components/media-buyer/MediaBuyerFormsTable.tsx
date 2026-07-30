import Link from 'next/link';
import type { MediaBuyerFormRow } from '@/modules/media-buyer/services/media-buyer.service';

const GRID =
  'grid grid-cols-[1.6fr_1.2fr_0.7fr_0.7fr_0.7fr_0.8fr_0.7fr] gap-3 px-6 py-4 items-center';

/**
 * Every form a media buyer owns, with its window-scoped counts. Rows link to
 * the form detail page. `hrefBase` is the buyer's forms route, so the same table
 * works from both the forms page and the analytics page.
 */
export function MediaBuyerFormsTable({
  forms,
  hrefBase,
  limit,
}: {
  forms: MediaBuyerFormRow[];
  hrefBase: string;
  limit?: number;
}) {
  const rows = limit ? forms.slice(0, limit) : forms;

  return (
    <div className="bg-white rounded-2xl border border-gray-50 shadow-sm overflow-hidden">
      <div
        className={`${GRID} bg-gray-50/50 text-[11px] font-bold text-gray-500 uppercase tracking-wider`}
      >
        <span>Form</span>
        <span>Product</span>
        <span className="text-center">Views</span>
        <span className="text-center">Leads</span>
        <span className="text-center">Delivered</span>
        <span className="text-center">Conversion</span>
        <span className="text-center">Status</span>
      </div>

      {rows.length === 0 ? (
        <div className="px-6 py-16 text-center text-sm text-gray-400">
          This buyer has no forms yet.
        </div>
      ) : (
        rows.map((form) => (
          <Link
            key={form.id}
            href={`${hrefBase}/${form.id}`}
            className={`${GRID} border-t border-gray-50 text-sm hover:bg-gray-50 transition-colors`}
          >
            <div className="min-w-0">
              <p className="font-bold text-gray-800 leading-tight truncate">{form.name}</p>
              <p className="text-[11px] text-gray-400">{form.createdAt.slice(0, 10)}</p>
            </div>
            <span className="text-gray-600 truncate">{form.productName}</span>
            <span className="text-center font-semibold text-gray-700">
              {form.views.toLocaleString()}
            </span>
            <span className="text-center font-semibold text-gray-700">
              {form.leads.toLocaleString()}
            </span>
            <span className="text-center font-semibold text-gray-700">
              {form.delivered.toLocaleString()}
            </span>
            <span className="text-center font-bold text-gray-800">{form.conversionPct}%</span>
            <span className="flex justify-center">
              <span
                className={`inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  form.disabled
                    ? 'bg-gray-100 text-gray-500'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {form.disabled ? 'Disabled' : 'Active'}
              </span>
            </span>
          </Link>
        ))
      )}
    </div>
  );
}
