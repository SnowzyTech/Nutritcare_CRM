import StaffDetailPage from "../../staff-detail-page";

type Props = { params: Promise<{ id: string }> };

export default async function DataAnalystDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <StaffDetailPage
      id={id}
      roleLabel="Data Analysts"
      basePath="/admin/staff/data-analyst"
    />
  );
}
