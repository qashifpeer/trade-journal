// src/components/dashboard/mistakes-card.tsx
import { TriangleAlert } from "lucide-react";
import type { MistakeCount } from "@/src/types/trade";

export function MistakesCard({ mistakes }: { mistakes: MistakeCount[] }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-[0_0_30px_rgba(236,72,153,0.08)]">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-pink-300/20 bg-pink-400/10">
          <TriangleAlert className="h-5 w-5 text-pink-300" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Most Common Mistakes</h2>
          <p className="text-sm text-slate-400">
            Parsed from your mistakes journal text
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {mistakes.length > 0 ? (
          mistakes.map((item, index) => (
            <div
              key={item.mistake}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-400/10 text-xs font-semibold text-pink-300">
                  {index + 1}
                </span>
                <span className="text-sm text-slate-200">{item.mistake}</span>
              </div>

              <span className="rounded-full border border-pink-300/20 bg-pink-400/10 px-3 py-1 text-xs font-medium text-pink-200">
                {item.count} trades
              </span>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-6 text-sm text-slate-400">
            No mistakes recorded for this month.
          </div>
        )}
      </div>
    </section>
  );
}