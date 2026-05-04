import StaffProfilePage from "../../../staff-profile-page";

type Props = { params: Promise<{ id: string }> };

export default async function LogisticsManagerProfilePage({ params }: Props) {
  const { id } = await params;
  return (
    <StaffProfilePage
      id={id}
      roleLabel="Logistics Managers"
      basePath="/admin/staff/logistics-manager"
    />
  );
}
