import type { Metadata } from "next";
import { getTeamsWithMemberCount } from "@/modules/users/services/users.service";
import TeamsClient from "./teams-client";

export const metadata: Metadata = { title: "Sales Rep Teams" };

export default async function TeamsPage() {
  const teams = await getTeamsWithMemberCount();
  return <TeamsClient teams={teams} />;
}
