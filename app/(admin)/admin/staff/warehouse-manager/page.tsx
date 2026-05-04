import type { Metadata } from "next";
import { getStaffByRole } from "@/modules/users/services/users.service";
import StaffListClient from "../staff-list-client";

export const metadata: Metadata = { title: "Warehouse Managers" };

export default async function WarehouseManagerPage() {
  const staff = await getStaffByRole("WAREHOUSE_MANAGER");
  return (
    <StaffListClient
      staff={staff}
      roleLabel="Warehouse Managers"
      detailBasePath="/admin/staff/warehouse-manager"
    />
  );
}
