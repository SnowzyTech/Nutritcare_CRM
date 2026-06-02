import type { Metadata } from "next";
import { FixedAssetAddClient } from "../../../_components/FixedAssetAddClient";

export const metadata: Metadata = {
  title: "Add Fixed Asset",
  description: "Add a new fixed asset with depreciation details and account mappings.",
};

export default async function FixedAssetAddPage() {
  return <FixedAssetAddClient />;
}
