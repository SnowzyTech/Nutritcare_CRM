import StaffDetailPage from "../../staff-detail-page";

type Props = { params: Promise<{ id: string }> };

export default async function WarehouseManagerDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <StaffDetailPage
      id={id}
      roleLabel="Warehouse Managers"
      basePath="/admin/staff/warehouse-manager"
    />
  );
}
