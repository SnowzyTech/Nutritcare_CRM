import { prisma } from "@/lib/db/prisma";
import { CHART_OF_ACCOUNTS } from "@/modules/finance/data/chart-of-accounts";
import { getChartOfAccounts } from "@/modules/finance/services/ledger.service";
import {
  accumulatedDepreciationAsOf,
  buildSchedule,
  type DepreciationMethod,
} from "@/modules/finance/lib/depreciation";

const fmt = (n: number) =>
  `₦${Number(n).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" });

// ── Account options for the Add form ───────────────────────────────────────────

export interface AccountOption {
  code: string;
  name: string;
}

interface ClassifiableAccount {
  code: string;
  accountName: string;
  accountClass: number | null;
  accountType: string | null;
  normalBalance: string | null;
}

function classify(rows: ClassifiableAccount[]) {
  const assetAccounts: AccountOption[] = [];
  const accumDepAccounts: AccountOption[] = [];
  const depExpenseAccounts: AccountOption[] = [];

  for (const r of rows) {
    const opt: AccountOption = { code: r.code, name: r.accountName };
    const isAccum = /accumulated/i.test(r.accountName);
    const isNonCurrentAsset =
      r.accountClass === 1 &&
      (r.accountType?.toLowerCase().includes("non-current") ||
        /^1[5-8]/.test(r.code));

    if (isAccum && r.accountClass === 1) {
      accumDepAccounts.push(opt);
    } else if (isNonCurrentAsset) {
      assetAccounts.push(opt);
    }

    if (r.accountClass === 6 && /deprecia|amort/i.test(r.accountName)) {
      depExpenseAccounts.push(opt);
    }
  }

  return { assetAccounts, accumDepAccounts, depExpenseAccounts };
}

/**
 * Account choices for the fixed-asset form, sourced from the live Chart of
 * Accounts (so in-app additions show up) with a static fallback if the COA has
 * not been seeded yet.
 */
export async function getFixedAssetAccountOptions() {
  const chart = await getChartOfAccounts();
  let result = classify(
    chart.map((c) => ({
      code: c.code,
      accountName: c.accountName,
      accountClass: c.accountClass,
      accountType: c.accountType,
      normalBalance: c.normalBalance,
    })),
  );

  // Fallback to the static COA for any category the live chart didn't cover.
  if (
    result.assetAccounts.length === 0 ||
    result.accumDepAccounts.length === 0 ||
    result.depExpenseAccounts.length === 0
  ) {
    const fromStatic = classify(
      CHART_OF_ACCOUNTS.map((c) => ({
        code: c.code,
        accountName: c.accountName,
        accountClass: c.accountClass,
        accountType: c.accountType,
        normalBalance: c.normalBalance,
      })),
    );
    result = {
      assetAccounts: result.assetAccounts.length ? result.assetAccounts : fromStatic.assetAccounts,
      accumDepAccounts: result.accumDepAccounts.length ? result.accumDepAccounts : fromStatic.accumDepAccounts,
      depExpenseAccounts: result.depExpenseAccounts.length ? result.depExpenseAccounts : fromStatic.depExpenseAccounts,
    };
  }

  return result;
}

// ── Register listing ────────────────────────────────────────────────────────

export interface FixedAssetRow {
  id: string;
  assetName: string;
  purchasePrice: string;
  purchaseDate: string;
  assetAccount: string;
  accumulatedDepreciation: string;
  remainingValue: string;
  status: "Active" | "Disposed" | "Idle";
}

export async function listFixedAssets(): Promise<FixedAssetRow[]> {
  const assets = await prisma.fixedAsset.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return assets.map((a) => {
    const cost = Number(a.purchasePrice);
    const salvage = Number(a.salvageValue);

    let accumulated = 0;
    if (!a.nonDepreciable && a.depreciationStartDate && a.usefulLifeYears && a.depreciationMethod) {
      accumulated = accumulatedDepreciationAsOf({
        purchasePrice: cost,
        salvageValue: salvage,
        usefulLifeYears: a.usefulLifeYears,
        depreciationStartDate: a.depreciationStartDate,
        method: a.depreciationMethod as DepreciationMethod,
      });
    }

    const remaining = Math.max(salvage, cost - accumulated);

    return {
      id: a.id,
      assetName: a.assetName,
      purchasePrice: fmt(cost),
      purchaseDate: fmtDate(a.purchaseDate),
      assetAccount: a.assetAccount,
      accumulatedDepreciation: fmt(accumulated),
      remainingValue: fmt(remaining),
      status: (a.status as FixedAssetRow["status"]) ?? "Active",
    };
  });
}

// ── Asset detail ──────────────────────────────────────────────────────────────

export interface FixedAssetScheduleRow {
  year: number;
  openingValue: string;
  depreciation: string;
  remainingValue: string;
}

export interface FixedAssetDetail {
  id: string;
  assetName: string;
  description: string | null;
  nonDepreciable: boolean;
  status: "Active" | "Disposed" | "Idle";
  // Raw numbers (for any client-side maths) + preformatted strings.
  purchasePrice: string;
  salvageValue: string;
  accumulatedDepreciation: string;
  remainingValue: string;
  purchaseDate: string;
  depreciationStartDate: string | null;
  depreciationMethod: string | null;
  usefulLifeYears: number | null;
  // Account mappings.
  assetAccount: string;
  assetAccountCode: string | null;
  accumDepreciationAccount: string | null;
  accumDepreciationCode: string | null;
  depExpenseAccount: string | null;
  depExpenseCode: string | null;
  disposedAt: string | null;
  createdAt: string;
  schedule: FixedAssetScheduleRow[];
}

export async function getFixedAssetDetail(id: string): Promise<FixedAssetDetail | null> {
  const a = await prisma.fixedAsset.findFirst({ where: { id, deletedAt: null } });
  if (!a) return null;

  const cost = Number(a.purchasePrice);
  const salvage = Number(a.salvageValue);

  const depreciable =
    !a.nonDepreciable &&
    !!a.depreciationStartDate &&
    !!a.usefulLifeYears &&
    !!a.depreciationMethod;

  const depInput = depreciable
    ? {
        purchasePrice: cost,
        salvageValue: salvage,
        usefulLifeYears: a.usefulLifeYears as number,
        depreciationStartDate: a.depreciationStartDate as Date,
        method: a.depreciationMethod as DepreciationMethod,
      }
    : null;

  const accumulated = depInput ? accumulatedDepreciationAsOf(depInput) : 0;
  const remaining = Math.max(salvage, cost - accumulated);
  const schedule = depInput
    ? buildSchedule(depInput).map((r) => ({
        year: r.year,
        openingValue: fmt(r.openingValue),
        depreciation: fmt(r.depreciation),
        remainingValue: fmt(r.remainingValue),
      }))
    : [];

  return {
    id: a.id,
    assetName: a.assetName,
    description: a.description,
    nonDepreciable: a.nonDepreciable,
    status: (a.status as FixedAssetDetail["status"]) ?? "Active",
    purchasePrice: fmt(cost),
    salvageValue: fmt(salvage),
    accumulatedDepreciation: fmt(accumulated),
    remainingValue: fmt(remaining),
    purchaseDate: fmtDate(a.purchaseDate),
    depreciationStartDate: a.depreciationStartDate ? fmtDate(a.depreciationStartDate) : null,
    depreciationMethod: a.depreciationMethod,
    usefulLifeYears: a.usefulLifeYears,
    assetAccount: a.assetAccount,
    assetAccountCode: a.assetAccountCode,
    accumDepreciationAccount: a.accumDepreciationAccount,
    accumDepreciationCode: a.accumDepreciationCode,
    depExpenseAccount: a.depExpenseAccount,
    depExpenseCode: a.depExpenseCode,
    disposedAt: a.disposedAt ? fmtDate(a.disposedAt) : null,
    createdAt: fmtDate(a.createdAt),
    schedule,
  };
}

// Re-export the pure schedule builder so server callers have one import site.
export { buildSchedule };
