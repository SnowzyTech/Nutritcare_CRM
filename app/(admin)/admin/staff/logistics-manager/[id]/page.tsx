import StaffDetailPage from "../../staff-detail-page";

type Props = { params: Promise<{ id: string }> };

export default async function LogisticsManagerDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <StaffDetailPage
      id={id}
      roleLabel="Logistics Managers"
      basePath="/admin/staff/logistics-manager"
    />
  );
}
