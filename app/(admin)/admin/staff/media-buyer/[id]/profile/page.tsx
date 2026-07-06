import StaffProfilePage from "../../../staff-profile-page";

type Props = { params: Promise<{ id: string }> };

export default async function MediaBuyerProfilePage({ params }: Props) {
  const { id } = await params;
  return (
    <StaffProfilePage
      id={id}
      roleLabel="Media Buyers"
      basePath="/admin/staff/media-buyer"
    />
  );
}
