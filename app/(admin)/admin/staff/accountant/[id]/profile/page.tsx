import StaffProfilePage from "../../../staff-profile-page";

type Props = { params: Promise<{ id: string }> };

export default async function AccountantProfilePage({ params }: Props) {
  const { id } = await params;
  return (
    <StaffProfilePage
      id={id}
      roleLabel="Accountants"
      basePath="/admin/staff/accountant"
    />
  );
}
