import StaffProfilePage from "../../../staff-profile-page";

type Props = { params: Promise<{ id: string }> };

export default async function WarehouseManagerProfilePage({ params }: Props) {
  const { id } = await params;
  return (
    <StaffProfilePage
      id={id}
      roleLabel="Warehouse Managers"
      basePath="/admin/staff/warehouse-manager"
    />
  );
}
