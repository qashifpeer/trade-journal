// src/components/dashboard/outcome-breakdown-card.tsx
import { ChartPie } from "lucide-react";
import { InsightCard } from "./insight-card";
import type { OutcomeBreakdownItem } from "@/src/lib/dashboard";

type Props = {
  items: OutcomeBreakdownItem[];
};

function getTone(label: string) {
  switch (label.toLowerCase()) {
    case "full success":
      return "bg-emerald-400";
    case "partial success":
      return "bg-cyan-400";
    case "followed plan":
      return "bg-violet-400";
    case "mistake":
      return "bg-pink-400";
    default:
      return "bg-slate-400";
  }
}

export function OutcomeBreakdownCard({ items }: Props) {
  return (
    <InsightCard
      title="Outcome Breakdown"
      subtitle="How your trades were classified this month"
      icon={ChartPie}
      iconClassName="text-pink-300"
    >
      <div className="space-y-3">
        {items.length ? (
          items.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-white">{item.label}</span>
                <span className="text-xs text-slate-400">
                  {item.count} trades • {item.percentage.toFixed(1)}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/5">
                <div
                  className={`h-full rounded-full ${getTone(item.label)}`}
                  style={{ width: `${Math.min(item.percentage, 100)}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-6 text-sm text-slate-400">
            No outcome data for this period.
          </div>
        )}
      </div>
    </InsightCard>
  );
}