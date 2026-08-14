import type { Metadata } from "next";
import { listOversightStaff } from "@/modules/chat/services/chat-oversight.service";
import { DEPARTMENT_FILTERS } from "@/lib/staff-departments";
import { OversightStaffListClient } from "./_components/oversight-staff-list-client";

export const metadata: Metadata = { title: "Chat Oversight" };

type PageProps = {
  searchParams: Promise<{ q?: string; department?: string }>;
};

export default async function ChatOversightPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const department = params.department ?? "ALL";
  const q = params.q ?? "";

  const staff = await listOversightStaff({ q, department });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Chat Oversight</h1>
        <p className="mt-1 text-sm text-gray-500">
          Read-only view of staff direct messages. Opening a conversation here does
          not mark it as read or notify anyone.
        </p>
      </div>

      <OversightStaffListClient
        staff={staff}
        departments={DEPARTMENT_FILTERS}
        selectedDepartment={department}
        search={q}
      />
    </div>
  );
}
