import StaffDetailPage from "../../staff-detail-page";
import MediaBuyerFormsSection from "./media-buyer-forms-section";
import { parseStaffPeriod } from "@/lib/staff-period";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ g?: string; month?: string; w?: string; d?: string }>;
};

export default async function MediaBuyerDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const period = parseStaffPeriod(await searchParams);
  return (
    <StaffDetailPage
      id={id}
      roleLabel="Media Buyers"
      basePath="/admin/staff/media-buyer"
      extra={<MediaBuyerFormsSection userId={id} period={period} />}
    />
  );
}
