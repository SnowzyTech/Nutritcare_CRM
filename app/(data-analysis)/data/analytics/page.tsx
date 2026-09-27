import { AnalyticsClient } from "../_components/AnalyticsClient";
import {
  getTeamsAnalytics,
  getCompanyAnalytics,
} from "@/modules/data-analysis/services/data-analysis.service";
import { parseStaffPeriod, type StaffPeriodParams } from "@/lib/staff-period";

export default async function AnalyticsPage(props: {
  searchParams: Promise<StaffPeriodParams>;
}) {
  // Day / Week (Mon–Sun) / Month — shared with every analytics screen; lives in
  // the URL (?g=&d=|w=|month=) so the page re-renders server-side on change.
  const sp = parseStaffPeriod(await props.searchParams);

  const [teamsData, companyData] = await Promise.all([
    getTeamsAnalytics({ period: sp.arg }),
    getCompanyAnalytics({ period: sp.arg }),
  ]);

  return (
    <AnalyticsClient
      teamsData={teamsData}
      companyData={companyData}
      period={{
        comparisonLabel: sp.comparisonLabel,
        valueLabel: sp.valueLabel,
        bonusPeriod: sp.bonusPeriod,
      }}
    />
  );
}
