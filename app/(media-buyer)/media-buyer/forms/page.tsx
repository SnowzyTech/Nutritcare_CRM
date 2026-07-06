import type { Metadata } from "next";
import { auth } from "@/lib/auth/auth";
import { getMyFormRows } from "@/modules/media-buyer/services/media-buyer.service";
import { MediaBuyerTopbar } from "../_components/topbar";
import MediaBuyerFormsClient from "./forms-client";

export const metadata: Metadata = { title: "Forms" };

export default async function MyFormsPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "";
  const rows = userId ? await getMyFormRows(userId) : [];

  return (
    <div className="max-w-[1320px] mx-auto pb-16">
      <MediaBuyerTopbar title="Forms" />
      <MediaBuyerFormsClient rows={rows} />
    </div>
  );
}
