import StaffProfilePage from "../../../staff-profile-page";

type Props = { params: Promise<{ id: string }> };

export default async function SalesManagerProfilePage({ params }: Props) {
  const { id } = await params;
  return (
    <StaffProfilePage
      id={id}
      roleLabel="Sales Managers"
      basePath="/admin/staff/sales-manager"
    />
  );
}
