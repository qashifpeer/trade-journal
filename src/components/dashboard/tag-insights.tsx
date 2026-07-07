"use client";

import { DashboardTagInsight } from "@/src/types/intraday-dashboard";
import { DashboardPanel } from "@/src/components/dashboard/dashboard-panel";
import { formatSignedInr } from "@/src/lib/dashboard-format";

type TagInsightsProps = {
  topPositiveTags: DashboardTagInsight[];
  topNegativeTags: DashboardTagInsight[];
  mostUsedTags: DashboardTagInsight[];
};

function TagList({
  title,
  items,
  tone,
}: {
  title: string;
  items: DashboardTagInsight[];
  tone: "green" | "red" | "cyan";
}) {
  const toneClasses = {
    green: "border-emerald-400/15 bg-emerald-400/5 text-emerald-300",
    red: "border-rose-400/15 bg-rose-400/5 text-rose-300",
    cyan: "border-cyan-400/15 bg-cyan-400/5 text-cyan-300",
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white">
          {title}
        </h3>
        <span className={`rounded-full border px-2.5 py-1 text-[11px] ${toneClasses[tone]}`}>
          {items.length} tags
        </span>
      </div>

      <div className="space-y-3">
        {items.length ? (
          items.map((item) => (
            <div
              key={item.tag}
              className="rounded-2xl border border-white/10 bg-slate-950/60 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-white">{item.tag}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    Used {item.count} times • Green {item.greenDays} • Red {item.redDays}
                  </div>
                </div>

                <div
                  className={`text-sm font-semibold ${
                    item.totalNetPnl >= 0 ? "text-emerald-300" : "text-rose-300"
                  }`}
                >
                  {formatSignedInr(item.totalNetPnl)}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-500">
            No tags found for this period.
          </div>
        )}
      </div>
    </div>
  );
}

export function TagInsights({
  topPositiveTags,
  topNegativeTags,
  mostUsedTags,
}: TagInsightsProps) {
  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <TagList title="Top positive tags" items={topPositiveTags} tone="green" />
      <TagList title="Top negative tags" items={topNegativeTags} tone="red" />
      <TagList title="Most used tags" items={mostUsedTags} tone="cyan" />
    </section>
  );
}