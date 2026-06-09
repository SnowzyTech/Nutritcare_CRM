import type { Metadata } from "next";
import { MoreVertical, Plus } from "lucide-react";

export const metadata: Metadata = { title: "WhatsApp Marketing" };

const phoneSummary = {
  phoneNumber: "09172639723",
  displayName: "Nucle WhatsApp",
  status: "Connected",
  contacts: "5000",
};

const menuItems = [
  "Dashboard",
  "Templates",
  "Flows",
  "Quick Reply",
  "Contacts",
  "Campaigns",
  "Automation",
  "Drip Sequence",
  "Analytics",
  "Inbox",
];

const tableRows = Array.from({ length: 5 }, () => ({
  name: "Balm New Price",
  date: "Balm New Price",
  status: "Status",
}));

const summaryCards = [
  { title: "Campaign" },
  { title: "Message Templates" },
  { title: "Contacts" },
  { title: "Quick Links" },
];

const chartDays = [
  { day: "Mo", earning: 18, view: 46, sale: 58 },
  { day: "Ta", earning: 26, view: 64, sale: 92 },
  { day: "We", earning: 34, view: 96, sale: 128 },
  { day: "Th", earning: 36, view: 112, sale: 178 },
  { day: "Fr", earning: 40, view: 140, sale: 205 },
  { day: "Sa", earning: 22, view: 72, sale: 112 },
  { day: "Su", earning: 28, view: 84, sale: 102 },
];

function InfoBlock({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="mb-1 text-[11px] font-medium text-[#8b8b8b]">{label}</p>
      <p className="text-[15px] font-bold leading-tight text-[#5f5f5f]">
        {value}
      </p>
    </div>
  );
}

function MetricPill({
  color,
  value,
  label,
}: {
  color: string;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="h-[17px] w-[17px] rounded-[4px]"
        style={{ backgroundColor: color }}
      />
      <div className="leading-none">
        <p className="text-[13px] font-extrabold text-black">{value}</p>
        <p className="mt-1 text-[7px] font-semibold text-[#9b9b9b]">{label}</p>
      </div>
    </div>
  );
}

function AnalyticsChart() {
  const maxValue = Math.max(...chartDays.map((day) => day.sale));

  return (
    <div className="flex items-end gap-[10px]">
      <div className="flex h-[96px] w-[150px] items-end gap-[10px] border-t border-[#eeeeee] pt-2">
        {chartDays.map((day) => (
          <div key={day.day} className="flex w-[12px] flex-col items-center">
            <div className="flex h-[76px] w-[10px] flex-col justify-end overflow-hidden rounded-t-[2px]">
              <span
                className="w-full bg-[#2d8df0]"
                style={{ height: `${(day.sale / maxValue) * 100}%` }}
              />
              <span
                className="w-full bg-[#16b978]"
                style={{ height: `${(day.view / maxValue) * 100}%` }}
              />
              <span
                className="w-full bg-[#ffa20b]"
                style={{ height: `${(day.earning / maxValue) * 100}%` }}
              />
            </div>
            <span className="mt-1 text-[6px] font-bold text-[#4f4f4f]">
              {day.day}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryTable({ title }: { title: string }) {
  return (
    <section className="h-[184px] rounded-[14px] border border-[#cecece] bg-white px-[18px] py-[18px]">
      <h2 className="mb-[18px] text-[14px] font-extrabold text-[#777777]">
        {title}
      </h2>
      <div className="grid grid-cols-[1fr_1fr_0.7fr] gap-4 text-[10px]">
        <span className="text-[#707070]">Name</span>
        <span className="text-[#707070]">Date</span>
        <span className="text-[#707070]">Status</span>
        {tableRows.map((row, index) => (
          <div key={`${title}-${index}`} className="contents">
            <span className="font-medium text-[#cf4cff]">{row.name}</span>
            <span className="text-[#707070]">{row.date}</span>
            <span className="text-[#707070]">{row.status}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function WhatsAppMarketingPage() {
  return (
    <div className="mx-auto flex max-w-[1120px] gap-[38px]">
      <aside className="min-h-[812px] w-[178px] shrink-0 rounded-[10px] bg-white px-5 py-[30px]">
        <nav className="space-y-[6px]">
          {menuItems.map((item) => {
            const active = item === "Dashboard";

            return (
              <div
                key={item}
                className={`rounded-[7px] px-5 py-[11px] text-[14px] font-medium ${
                  active
                    ? "bg-[#f1ddfb] text-[#bd00ff]"
                    : "text-[#828282]"
                }`}
              >
                {item}
              </div>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 space-y-[14px]">
        <section className="flex h-[58px] items-center justify-between rounded-[10px] bg-white px-[18px]">
          <div className="grid flex-1 grid-cols-4 gap-8">
            <InfoBlock
              label="Phone Number"
              value={phoneSummary.phoneNumber}
            />
            <InfoBlock
              label="Display Name"
              value={phoneSummary.displayName}
            />
            <InfoBlock label="Status" value={phoneSummary.status} />
            <InfoBlock
              label="No. of Contacts"
              value={phoneSummary.contacts}
            />
          </div>

          <button
            type="button"
            className="flex h-[37px] items-center gap-2 rounded-[5px] bg-[#a400f6] px-[18px] text-[11px] font-extrabold text-white"
          >
            <Plus size={13} strokeWidth={3} />
            Add Phone No.
          </button>
        </section>

        <section className="grid h-[58px] grid-cols-[0.55fr_1fr_1fr_1.05fr_1.05fr_1fr] items-center gap-8 rounded-[10px] bg-white px-[18px]">
          <p className="text-[11px] font-medium text-[#8b8b8b]">API usage</p>
          <InfoBlock label="Phone Number" value={phoneSummary.phoneNumber} />
          <InfoBlock label="Phone Number" value={phoneSummary.phoneNumber} />
          <InfoBlock label="Display Name" value={phoneSummary.displayName} />
          <InfoBlock label="Status" value={phoneSummary.status} />
          <InfoBlock label="No. of Contacts" value={phoneSummary.contacts} />
        </section>

        <section className="flex h-[200px] items-center justify-between rounded-[10px] bg-white px-[18px]">
          <div className="grid w-[62%] grid-cols-3 gap-12">
            <InfoBlock
              label="Phone Number"
              value={phoneSummary.phoneNumber}
            />
            <InfoBlock
              label="Display Name"
              value={phoneSummary.displayName}
            />
            <InfoBlock label="Status" value={phoneSummary.status} />
          </div>

          <div className="mr-[14px] flex items-center gap-5">
            <div className="space-y-4">
              <div>
                <p className="text-[8px] font-extrabold text-black">
                  Analitic
                </p>
                <p className="text-[6px] font-medium text-[#c2c2c2]">
                  Earning Report Lorem Ipsum
                </p>
              </div>
              <div className="space-y-[9px]">
                <MetricPill color="#2d8df0" value="340" label="Sale" />
                <MetricPill color="#16b978" value="230" label="View" />
                <MetricPill color="#ffa20b" value="180" label="Earning" />
              </div>
            </div>
            <div className="relative pt-6">
              <AnalyticsChart />
              <MoreVertical
                size={13}
                className="absolute right-[-2px] top-[2px] text-[#9f9f9f]"
              />
            </div>
          </div>
        </section>

        <section className="min-h-[418px] rounded-[24px] bg-white px-5 py-5">
          <div className="grid grid-cols-3 gap-3">
            {summaryCards.slice(0, 3).map((card) => (
              <SummaryTable key={card.title} title={card.title} />
            ))}
            <SummaryTable title={summaryCards[3].title} />
          </div>
        </section>
      </div>
    </div>
  );
}
