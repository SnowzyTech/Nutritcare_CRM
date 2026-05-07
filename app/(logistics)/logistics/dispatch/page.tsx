import { Suspense } from "react";
import { getDispatchPageData } from "@/modules/delivery/services/logistics-dispatch.service";
import { DispatchClient } from "./dispatch-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Create Dispatch" };

export default async function DispatchPage() {
  const { orders, drivers } = await getDispatchPageData();
  return (
    <Suspense>
      <DispatchClient orders={orders} drivers={drivers} />
    </Suspense>
  );
}
