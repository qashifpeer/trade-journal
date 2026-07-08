"use client";

import { formatSignedInr } from "@/src/lib/dashboard-format";

type TooltipPayloadItem = {
  value: number;
  name: string;
  color?: string;
  payload?: Record<string, unknown>;
};

type ChartTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
};

export function ChartTooltip({
  active,
  payload,
  label,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-[180px] rounded-2xl border border-cyan-400/20 bg-slate-950/95 px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <div className="mb-2 text-xs uppercase tracking-[0.2em] text-cyan-300">
        {label}
      </div>

      <div className="space-y-1.5">
        {payload.map((item) => {
          const isMoney =
            item.name.toLowerCase().includes("pnl") ||
            item.name.toLowerCase().includes("charge");

          return (
            <div
              key={item.name}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <div className="flex items-center gap-2 text-slate-300">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color || "#22d3ee" }}
                />
                <span>{item.name}</span>
              </div>

              <span className="font-medium text-white">
                {typeof item.value === "number"
                  ? isMoney
                    ? formatSignedInr(item.value)
                    : item.value
                  : item.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}