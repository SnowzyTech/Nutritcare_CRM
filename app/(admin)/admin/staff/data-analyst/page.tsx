import type { Metadata } from "next";
import { getStaffByRole } from "@/modules/users/services/users.service";
import StaffListClient from "../staff-list-client";

export const metadata: Metadata = { title: "Data Analysts" };

export default async function DataAnalystPage() {
  const staff = await getStaffByRole("DATA_ANALYST");
  return (
    <StaffListClient
      staff={staff}
      roleLabel="Data Analysts"
      detailBasePath="/admin/staff/data-analyst"
    />
  );
}
