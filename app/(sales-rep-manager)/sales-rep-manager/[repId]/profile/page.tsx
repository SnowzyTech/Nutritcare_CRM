import { MOCK_REP_DETAILS } from "@/lib/mock-data/sales-rep-manager";
import { notFound } from "next/navigation";
import { ProfileClient } from "./profile-client";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ repId: string }>;
}) {
  const { repId } = await params;
  const rep = MOCK_REP_DETAILS[repId] || MOCK_REP_DETAILS["2"];

  if (!rep) {
    notFound();
  }

  return <ProfileClient rep={rep} repId={repId} />;
}
