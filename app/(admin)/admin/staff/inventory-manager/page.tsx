import type { Metadata } from "next";
import { getStaffByRole } from "@/modules/users/services/users.service";
import StaffListClient from "../staff-list-client";

export const metadata: Metadata = { title: "Inventory Managers" };

export default async function InventoryManagerPage() {
  const staff = await getStaffByRole("INVENTORY_MANAGER");
  return (
    <StaffListClient
      staff={staff}
      roleLabel="Inventory Managers"
      detailBasePath="/admin/staff/inventory-manager"
    />
  );
}
