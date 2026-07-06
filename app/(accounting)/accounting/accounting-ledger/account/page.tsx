import { AccountLedgerClient } from "../../_components/AccountLedgerClient";
import { getAccountLedger } from "@/modules/finance/services/ledger.service";

export default async function AccountLedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string; name?: string; hl?: string }>;
}) {
  const { account = "", name = "", hl } = await searchParams;
  const { rows } = await getAccountLedger({ account, name });

  return (
    <AccountLedgerClient
      account={account}
      name={name}
      rows={rows}
      highlightKey={hl}
    />
  );
}
