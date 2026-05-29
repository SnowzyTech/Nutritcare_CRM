import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getDriverById } from "@/modules/delivery/services/create-driver.service";
import DriverDetailClient from "./driver-detail-client";

export default async function DriverDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const driver = await getDriverById(id);
  if (!driver) notFound();
  return (
    <div className="max-w-6xl mx-auto space-y-8 pt-4 pb-20">
      <Link
        href="/logistics/agents"
        className="flex items-center gap-2 text-gray-500 hover:text-[#ad1df4] transition-colors text-sm font-medium w-fit"
      >
        <ArrowLeft className="w-5 h-5" /> Back to Agents
      </Link>
      <DriverDetailClient driver={driver} />
    </div>
  );
}
