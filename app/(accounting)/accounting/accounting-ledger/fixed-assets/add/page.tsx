import type { Metadata } from "next";
import { FixedAssetAddClient } from "../../../_components/FixedAssetAddClient";
import { getFixedAssetAccountOptions } from "@/modules/finance/services/fixed-assets.service";

export const metadata: Metadata = {
  title: "Add Fixed Asset",
  description: "Add a new fixed asset with depreciation details and account mappings.",
};

export default async function FixedAssetAddPage() {
  const { assetAccounts, accumDepAccounts, depExpenseAccounts } =
    await getFixedAssetAccountOptions();

  return (
    <FixedAssetAddClient
      assetAccounts={assetAccounts}
      accumDepAccounts={accumDepAccounts}
      depExpenseAccounts={depExpenseAccounts}
    />
  );
}
