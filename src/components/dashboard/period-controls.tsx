"use client";

import { DashboardPeriodType } from "@/src/types/intraday-dashboard";

type PeriodControlsProps = {
  periodType: DashboardPeriodType;
  value: string;
  onPeriodTypeChange: (next: DashboardPeriodType) => void;
  onValueChange: (next: string) => void;
};

const PERIOD_OPTIONS: { label: string; value: DashboardPeriodType }[] = [
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Quarterly", value: "quarterly" },
  { label: "Yearly", value: "yearly" },
];

function getCurrentWeekInputValue() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}

function getCurrentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getCurrentQuarterValue() {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  return `${now.getFullYear()}-Q${quarter}`;
}

function getCurrentYearValue() {
  return String(new Date().getFullYear());
}

export function getDefaultPeriodValue(periodType: DashboardPeriodType) {
  switch (periodType) {
    case "weekly":
      return getCurrentWeekInputValue();
    case "monthly":
      return getCurrentMonthValue();
    case "quarterly":
      return getCurrentQuarterValue();
    case "yearly":
      return getCurrentYearValue();
    default:
      return getCurrentMonthValue();
  }
}

export function PeriodControls({
  periodType,
  value,
  onPeriodTypeChange,
  onValueChange,
}: PeriodControlsProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="inline-flex w-full rounded-2xl border border-cyan-400/15 bg-slate-900/70 p-1 backdrop-blur md:w-auto">
        {PERIOD_OPTIONS.map((option) => {
          const active = option.value === periodType;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onPeriodTypeChange(option.value)}
              className={[
                "min-h-11 rounded-xl px-4 py-2 text-sm font-medium transition",
                active
                  ? "bg-cyan-400/15 text-cyan-300 shadow-[inset_0_0_20px_rgba(34,211,238,0.15)]"
                  : "text-slate-400 hover:text-slate-200",
              ].join(" ")}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        {periodType === "weekly" ? (
          <input
            type="date"
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            className="min-h-11 rounded-2xl border border-cyan-400/15 bg-slate-950/70 px-4 text-sm text-slate-200 outline-none backdrop-blur placeholder:text-slate-500"
          />
        ) : null}

        {periodType === "monthly" ? (
          <input
            type="month"
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            className="min-h-11 rounded-2xl border border-cyan-400/15 bg-slate-950/70 px-4 text-sm text-slate-200 outline-none backdrop-blur"
          />
        ) : null}

        {periodType === "quarterly" ? (
          <select
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            className="min-h-11 rounded-2xl border border-cyan-400/15 bg-slate-950/70 px-4 text-sm text-slate-200 outline-none backdrop-blur"
          >
            {Array.from({ length: 6 }).flatMap((_, yearIndex) => {
              const year = new Date().getFullYear() - 3 + yearIndex;

              return [1, 2, 3, 4].map((q) => {
                const optionValue = `${year}-Q${q}`;
                return (
                  <option key={optionValue} value={optionValue}>
                    {optionValue}
                  </option>
                );
              });
            })}
          </select>
        ) : null}

        {periodType === "yearly" ? (
          <select
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            className="min-h-11 rounded-2xl border border-cyan-400/15 bg-slate-950/70 px-4 text-sm text-slate-200 outline-none backdrop-blur"
          >
            {Array.from({ length: 8 }).map((_, index) => {
              const year = new Date().getFullYear() - index;
              return (
                <option key={year} value={String(year)}>
                  {year}
                </option>
              );
            })}
          </select>
        ) : null}
      </div>
    </div>
  );
}