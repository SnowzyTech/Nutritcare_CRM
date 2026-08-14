"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Search } from "lucide-react";
import { ChatAvatar } from "@/app/chat/_components/chat-people";
import { roleLabel } from "@/lib/chat/role-label";
import type { OversightStaff } from "@/modules/chat/services/chat-oversight.service";

type Props = {
  staff: OversightStaff[];
  departments: { value: string; label: string }[];
  selectedDepartment: string;
  search: string;
};

export function OversightStaffListClient({
  staff,
  departments,
  selectedDepartment,
  search,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(search);

  const setParam = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      startTransition(() => router.push(`${pathname}?${params.toString()}`));
    },
    [router, pathname, searchParams]
  );

  // Debounced search → URL. The effect's cleanup is what makes it a real
  // debounce: each keystroke cancels the pending push.
  useEffect(() => {
    if (searchValue === search) return;
    const handle = setTimeout(() => setParam({ q: searchValue || undefined }), 350);
    return () => clearTimeout(handle);
  }, [searchValue, search, setParam]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <select
          value={selectedDepartment}
          onChange={(e) => setParam({ department: e.target.value })}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-purple-400"
        >
          {departments.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>

        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search staff by name or email"
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-purple-400"
          />
        </div>
      </div>

      <div
        className={`overflow-hidden rounded-xl border border-gray-200 bg-white transition-opacity ${
          pending ? "opacity-60" : ""
        }`}
      >
        {staff.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500">
            No staff match this filter.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {staff.map((person) => (
              <li key={person.id}>
                <Link
                  href={`/admin/chat-oversight/${person.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-purple-50/60"
                >
                  <ChatAvatar name={person.name} avatarUrl={person.avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {person.name}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {roleLabel(person.role)}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {person.dmCount}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
