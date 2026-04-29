import type { Metadata } from "next";
import { getStaffByRole } from "@/modules/users/services/users.service";
import StaffListClient from "../staff-list-client";

export const metadata: Metadata = { title: "Accountants" };

export default async function AccountantPage() {
  const staff = await getStaffByRole("ACCOUNTANT");
  return (
    <StaffListClient
      staff={staff}
      roleLabel="Accountants"
      detailBasePath="/admin/staff/accountant"
    />
  );
}
