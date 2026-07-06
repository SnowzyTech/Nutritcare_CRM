import { getMediaBuyerDashboard } from "@/modules/media-buyer/services/media-buyer.service";
import { formatDate } from "@/lib/utils";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-[20px] p-6 shadow-sm border border-slate-50">
      <p className="text-[0.8rem] font-bold text-slate-500 mb-6">{label}</p>
      <span className="text-[2rem] font-black leading-none text-slate-800">{value}</span>
    </div>
  );
}

const GRID = "grid grid-cols-[1.6fr_1.2fr_0.8fr_0.7fr_0.7fr_0.8fr_0.8fr] gap-3";

/** Read-only view of a media buyer's forms + performance (all-time). */
export default async function MediaBuyerFormsSection({ userId }: { userId: string }) {
  const { metrics, funnel, forms } = await getMediaBuyerDashboard(userId);

  return (
    <div>
      <h2 className="text-lg font-bold mb-4 text-slate-600">Forms &amp; Performance</h2>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <StatCard label="Total Forms" value={metrics.totalForms.toLocaleString()} />
        <StatCard label="Total Leads" value={metrics.totalLeads.toLocaleString()} />
        <StatCard label="Total Delivered" value={metrics.totalDeliveredOrders.toLocaleString()} />
        <StatCard label="Total Views" value={funnel.views.toLocaleString()} />
      </div>

      {/* Forms table */}
      <div className="bg-white rounded-[20px] shadow-sm border border-slate-50 overflow-hidden">
        <div className={`${GRID} px-6 py-4 bg-[#eee] text-[0.8rem] font-bold text-slate-600 uppercase tracking-tight`}>
          <span>Form Name</span>
          <span>Product</span>
          <span>Status</span>
          <span>Views</span>
          <span>Leads</span>
          <span>Delivered</span>
          <span>Conv.</span>
        </div>

        {forms.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400 text-[0.9rem]">
            No forms created yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {forms.map((f) => (
              <div key={f.id} className={`${GRID} px-6 py-4 items-center`}>
                <div>
                  <p className="text-[0.9rem] font-semibold text-slate-900 leading-tight">{f.name}</p>
                  <p className="text-[0.75rem] text-slate-400 mt-0.5">
                    {formatDate(new Date(f.createdAt))}
                  </p>
                </div>
                <span className="text-[0.9rem] text-slate-600">{f.productName}</span>
                <span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[0.72rem] font-bold border ${
                      f.disabled
                        ? "border-rose-400 text-rose-500"
                        : "border-emerald-500 text-emerald-500"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${f.disabled ? "bg-rose-400" : "bg-emerald-500"}`} />
                    {f.disabled ? "Disabled" : "Active"}
                  </span>
                </span>
                <span className="text-[0.9rem] font-semibold text-slate-700">{f.views.toLocaleString()}</span>
                <span className="text-[0.9rem] font-semibold text-slate-700">{f.leads.toLocaleString()}</span>
                <span className="text-[0.9rem] font-semibold text-slate-700">{f.delivered.toLocaleString()}</span>
                <span className="text-[0.9rem] font-semibold text-slate-700">{f.conversionPct}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
