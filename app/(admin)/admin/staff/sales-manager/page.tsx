import type { Metadata } from "next";
import { getStaffByRole } from "@/modules/users/services/users.service";
import StaffListClient from "../staff-list-client";

export const metadata: Metadata = { title: "Sales Managers" };

export default async function SalesManagerPage() {
  const staff = await getStaffByRole("SALES_REP_MANAGER");
  return (
    <StaffListClient
      staff={staff}
      roleLabel="Sales Managers"
      detailBasePath="/admin/staff/sales-manager"
    />
  );
}
