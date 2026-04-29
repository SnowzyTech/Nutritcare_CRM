import type { Metadata } from "next";
import { getStaffByRole } from "@/modules/users/services/users.service";
import StaffListClient from "../staff-list-client";

export const metadata: Metadata = { title: "Logistics Managers" };

export default async function LogisticsManagerPage() {
  const staff = await getStaffByRole("LOGISTICS_MANAGER");
  return (
    <StaffListClient
      staff={staff}
      roleLabel="Logistics Managers"
      detailBasePath="/admin/staff/logistics-manager"
    />
  );
}
