import StaffProfilePage from "../../../staff-profile-page";

type Props = { params: Promise<{ id: string }> };

export default async function InventoryManagerProfilePage({ params }: Props) {
  const { id } = await params;
  return (
    <StaffProfilePage
      id={id}
      roleLabel="Inventory Managers"
      basePath="/admin/staff/inventory-manager"
    />
  );
}
