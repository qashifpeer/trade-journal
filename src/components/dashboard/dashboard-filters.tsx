// src/components/dashboard/dashboard-filters.tsx
"use client";

import { CalendarRange } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  month: number;
  year: number;
  years?: number[];
};

export function DashboardFilters({
  month,
  year,
  years = [2024, 2025, 2026],
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2 rounded-2xl border border-cyan-300/15 bg-cyan-400/5 px-4 py-2 text-cyan-200">
        <CalendarRange className="h-4 w-4" />
        <span className="text-sm font-medium">Filter Period</span>
      </div>

      <select
        value={month}
        onChange={(e) => updateParam("month", e.target.value)}
        className="rounded-2xl border border-white/10 bg-[#121a2b] px-4 py-2.5 text-sm text-slate-200 outline-none transition focus:border-cyan-300/40"
      >
        {Array.from({ length: 12 }, (_, i) => (
          <option key={i + 1} value={i + 1}>
            {new Date(2000, i, 1).toLocaleString("en-US", { month: "long" })}
          </option>
        ))}
      </select>

      <select
        value={year}
        onChange={(e) => updateParam("year", e.target.value)}
        className="rounded-2xl border border-white/10 bg-[#121a2b] px-4 py-2.5 text-sm text-slate-200 outline-none transition focus:border-cyan-300/40"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}