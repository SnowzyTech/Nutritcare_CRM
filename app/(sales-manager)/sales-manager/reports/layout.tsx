import { ReportTabs } from "./_components/report-tabs";

/**
 * Sales reports — built on docs/CRM_Sales_Reporting_Template_.pdf (see
 * docs/sales-reporting.md). The (sales-manager) group layout already limits
 * the route to the company sales manager (+ super-admin, read-only).
 */
export default function SalesReportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <ReportTabs />
      {children}
    </div>
  );
}
