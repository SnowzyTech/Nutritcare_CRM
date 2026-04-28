import StaffDetailPage from "../../staff-detail-page";

type Props = { params: Promise<{ id: string }> };

export default async function AccountantDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <StaffDetailPage
      id={id}
      roleLabel="Accountants"
      basePath="/admin/staff/accountant"
    />
  );
}
