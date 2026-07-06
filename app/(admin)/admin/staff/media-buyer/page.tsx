import type { Metadata } from "next";
import { getStaffByRole } from "@/modules/users/services/users.service";
import StaffListClient from "../staff-list-client";

export const metadata: Metadata = { title: "Media Buyers" };

export default async function MediaBuyerStaffPage() {
  const staff = await getStaffByRole("MEDIA_BUYER");
  return (
    <StaffListClient
      staff={staff}
      roleLabel="Media Buyers"
      detailBasePath="/admin/staff/media-buyer"
    />
  );
}
