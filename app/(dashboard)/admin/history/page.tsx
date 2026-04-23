import type { Metadata } from "next";

export const metadata: Metadata = { title: "History" };

const historySections = [
  {
    heading: "Today",
    date: "February 9th, 2026",
    entries: [
      { timestamp: "Feb 7, 2026 – 09:42 AM", activity: "Login", description: "User logged in from Chrome (Desktop)" },
      { timestamp: "Feb 7, 2026 – 09:48 AM", activity: "Analysis Created", description: "Sales performance analysis created" },
      { timestamp: "Feb 7, 2026 – 10:02 AM", activity: "Report Generated", description: "Monthly sales report generated (PDF)" },
      { timestamp: "Feb 7, 2026 – 10:15 AM", activity: "Order Created", description: "Order #ORD-45821 placedPending" },
      { timestamp: "Feb 7, 2026 – 10:22 AM", activity: "Order Processing", description: "Order moved to processing" },
      { timestamp: "Feb 7, 2026 – 09:48 AM", activity: "Analysis Created", description: "Sales performance analysis created" },
      { timestamp: "Feb 7, 2026 – 09:42 AM", activity: "Login", description: "User logged in from Chrome (Desktop)" },
      { timestamp: "Feb 7, 2026 – 09:48 AM", activity: "Analysis Created", description: "Sales performance analysis created" },
      { timestamp: "Feb 7, 2026 – 09:42 AM", activity: "Login", description: "User logged in from Chrome (Desktop)" },
      { timestamp: "Feb 7, 2026 – 09:48 AM", activity: "Analysis Created", description: "Sales performance analysis created" },
    ],
  },
  {
    heading: "A Day Ago",
    date: "February 8th, 2026",
    entries: [
      { timestamp: "Feb 6, 2026 – 09:42 AM", activity: "Login", description: "User logged in from Chrome (Desktop)" },
      { timestamp: "Feb 6, 2026 – 09:48 AM", activity: "Analysis Created", description: "Sales performance analysis created" },
      { timestamp: "Feb 6, 2026 – 01:12 PM", activity: "Report Generated", description: "Quarterly revenue report generated (PDF)" },
      { timestamp: "Feb 6, 2026 – 03:25 PM", activity: "Order Created", description: "Order #ORD-45211 placedPending" },
    ],
  },
];

export default function HistoryPage() {
  return (
    <div className="max-w-[1120px] mx-auto font-inter text-slate-900 pb-24">
      <div className="flex items-start justify-between mb-10">
        <div>
          <h2 className="text-[2.15rem] font-black text-slate-800 leading-tight">History</h2>
        </div>
        <div className="text-right">
          <p className="text-[0.7rem] uppercase font-black text-slate-400 tracking-[0.2em]">Today</p>
          <p className="text-sm font-semibold text-slate-500">February 9th, 2026</p>
        </div>
      </div>

      {historySections.map((section, index) => (
        <div key={section.heading} className="mb-16">
          {index !== 0 && (
            <div className="flex justify-end mb-3">
              <div className="text-right">
                <p className="text-[0.65rem] uppercase font-black text-slate-400 tracking-[0.18em]">
                  {section.heading}
                </p>
                <p className="text-sm font-semibold text-slate-500">{section.date}</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100">
            <div className="grid grid-cols-[64px_1.6fr_1.1fr_1.5fr] items-center px-12 py-5 bg-slate-50 text-[0.75rem] font-black uppercase tracking-tight text-slate-500">
              <span></span>
              <span>Date &amp; Time</span>
              <span>Activity Type</span>
              <span>Description</span>
            </div>

            <div className="divide-y divide-slate-100">
              {section.entries.map((entry, i) => (
                <div
                  key={`${entry.timestamp}-${i}`}
                  className={`grid grid-cols-[64px_1.6fr_1.1fr_1.5fr] items-center px-12 py-6 text-[0.9rem] ${
                    i % 2 === 1 ? "bg-slate-50/60" : "bg-white"
                  } transition-colors hover:bg-purple-50/50`}
                >
                  <div className="flex items-center justify-center">
                    <span className="w-4 h-4 rounded-full border-2 border-slate-300 bg-white shadow-inner" />
                  </div>
                  <span className="font-semibold text-slate-700">{entry.timestamp}</span>
                  <span className="font-semibold text-slate-600">{entry.activity}</span>
                  <span className="text-slate-500">{entry.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
