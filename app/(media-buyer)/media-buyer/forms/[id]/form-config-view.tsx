import { formatDate } from "@/lib/utils";

/**
 * Read-only view of the configuration a media buyer filled in when creating
 * the form (its saved `data` JSON), grouped into readable panels.
 */

type Data = Record<string, unknown>;

function str(d: Data, key: string): string {
  const v = d[key];
  return typeof v === "string" ? v : "";
}
function isYes(d: Data, key: string): boolean {
  return d[key] === "Yes" || d[key] === "YES";
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <p className="text-sm font-black text-slate-800 mb-4">{title}</p>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-50 last:border-0">
      <span className="text-xs font-semibold text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-slate-800 text-right break-words max-w-[60%]">
        {value || <span className="text-slate-300">—</span>}
      </span>
    </div>
  );
}

export function FormConfigView({
  data,
  productName,
  createdAt,
}: {
  data: Data;
  productName: string;
  createdAt: string;
}) {
  const packages = Array.isArray(data.priceVariations)
    ? (data.priceVariations as Array<Record<string, unknown>>)
    : [];
  const upsellItems = Array.isArray(data.upsellItems)
    ? (data.upsellItems as Array<unknown>)
    : [];

  const payments = [
    data.paystackEnabled && "Paystack",
    data.flutterwaveEnabled && "Flutterwave",
    data.bankTransferEnabled && "Bank Transfer",
    data.payOnDeliveryEnabled && "Pay on Delivery",
  ].filter(Boolean) as string[];

  const fields = (data.fields ?? {}) as Record<
    string,
    { label?: string; show?: boolean; required?: boolean }
  >;
  const shownFields = Object.entries(fields).filter(([, f]) => f?.show);

  return (
    <div className="space-y-5">
      <p className="text-lg font-black text-slate-800">Form Details</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title="Overview">
          <Row label="Form Name" value={str(data, "formName")} />
          <Row label="Product" value={productName} />
          <Row label="Created" value={formatDate(new Date(createdAt))} />
          <Row
            label="Country Code on Phone"
            value={isYes(data, "showCountryCode") ? "Enabled" : "Disabled"}
          />
        </Panel>

        <Panel title="Content">
          <Row label="Header Text" value={str(data, "formHeaderText")} />
          <Row label="Sub-header Text" value={str(data, "formSubHeaderText")} />
          <Row label="Submit Button Text" value={str(data, "submitButtonText")} />
          <Row label="Opt-in Button Text" value={str(data, "optinButtonText")} />
        </Panel>

        <Panel title="Packages & Pricing">
          {packages.length === 0 ? (
            <p className="text-sm text-slate-400">No packages configured.</p>
          ) : (
            <div className="space-y-2">
              {packages.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2"
                >
                  <span className="font-semibold text-slate-700">
                    {String(p.name ?? `Package ${i + 1}`)}
                    {p.suffix ? ` ${String(p.suffix)}` : ""}
                  </span>
                  <span className="font-bold text-purple-700">
                    {String(p.formattedPrice ?? p.price ?? "")}
                    {p.note ? ` ${String(p.note)}` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Payment & Funnel">
          <Row
            label="Payment Methods"
            value={
              payments.length ? (
                <span className="flex flex-wrap gap-1.5 justify-end">
                  {payments.map((p) => (
                    <span
                      key={p}
                      className="text-[11px] font-semibold bg-purple-50 text-purple-700 rounded px-2 py-0.5"
                    >
                      {p}
                    </span>
                  ))}
                </span>
              ) : (
                ""
              )
            }
          />
          <Row label="Opt-in Form" value={isYes(data, "createOptinForm") ? "Yes" : "No"} />
          <Row label="Upsells" value={upsellItems.length ? `${upsellItems.length} offer(s)` : "None"} />
          <Row label="Sales Page URL" value={str(data, "salesPageUrl")} />
          <Row label="Thank-you URL" value={str(data, "thankYouUrl")} />
        </Panel>
      </div>

      <Panel title="Customer Fields">
        {shownFields.length === 0 ? (
          <p className="text-sm text-slate-400">No customer fields configured.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {shownFields.map(([key, f]) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-slate-50 text-slate-700 rounded-lg px-3 py-1.5"
              >
                {f.label || key.charAt(0).toUpperCase() + key.slice(1)}
                {f.required && <span className="text-rose-500">*</span>}
              </span>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
