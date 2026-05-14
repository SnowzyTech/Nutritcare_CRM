import { Suspense } from "react";
import { ReportsClient } from "../_components/ReportsClient";

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const initialTab = typeof searchParams.tab === 'string' ? searchParams.tab : undefined;
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReportsClient initialTab={initialTab} />
    </Suspense>
  );
}
