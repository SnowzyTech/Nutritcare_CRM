import StaffDetailPage from "../../staff-detail-page";
import MediaBuyerFormsSection from "./media-buyer-forms-section";

type Props = { params: Promise<{ id: string }> };

export default async function MediaBuyerDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <StaffDetailPage
      id={id}
      roleLabel="Media Buyers"
      basePath="/admin/staff/media-buyer"
      extra={<MediaBuyerFormsSection userId={id} />}
    />
  );
}
