// src/components/dashboard/group-performance-card.tsx
import { BarChart3 } from "lucide-react";
import { InsightCard } from "./insight-card";
import type { GroupedStat } from "@/src/lib/dashboard";

type Props = {
  title: string;
  subtitle: string;
  items: GroupedStat[];
  accent?: "cyan" | "violet" | "green";
};

function pnlClass(value: number) {
  if (value > 0) return "text-emerald-300";
  if (value < 0) return "text-rose-300";
  return "text-slate-300";
}

export function GroupPerformanceCard({
  title,
  subtitle,
  items,
  accent = "cyan",
}: Props) {
  const accentClass =
    accent === "violet"
      ? "text-violet-300"
      : accent === "green"
      ? "text-emerald-300"
      : "text-cyan-300";

  return (
    <InsightCard
      title={title}
      subtitle={subtitle}
      icon={BarChart3}
      iconClassName={accentClass}
    >
      <div className="space-y-3">
        {items.length ? (
          items.slice(0, 6).map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-medium text-white">{item.label}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.trades} trades • Win rate {item.winRate.toFixed(1)}%
                  </p>
                </div>

                <div className={`text-right text-sm font-semibold ${pnlClass(item.totalPnL)}`}>
                  {item.totalPnL > 0 ? "+" : ""}
                  ₹{item.totalPnL.toFixed(2)}
                </div>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                <div
                  className={`h-full rounded-full ${
                    accent === "violet"
                      ? "bg-violet-400"
                      : accent === "green"
                      ? "bg-emerald-400"
                      : "bg-cyan-400"
                  }`}
                  style={{ width: `${Math.min(item.winRate, 100)}%` }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                <span>Avg P&L: ₹{item.averagePnL.toFixed(2)}</span>
                <span>{item.winRate.toFixed(1)}% success</span>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-6 text-sm text-slate-400">
            No data for this period.
          </div>
        )}
      </div>
    </InsightCard>
  );
}