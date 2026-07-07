"use client";

import { DashboardDayRow } from "@/src/types/intraday-dashboard";
import { DashboardPanel } from "@/src/components/dashboard/dashboard-panel";
import { formatDisplayDate, formatSignedInr } from "@/src/lib/dashboard-format";

type DaywiseTableProps = {
  rows: DashboardDayRow[];
};

export function DaywiseTable({ rows }: DaywiseTableProps) {
  return (
    <DashboardPanel
      title="Daywise journal"
      subtitle="A quick scan of each saved trading day in the selected period."
    >
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-[0.18em] text-slate-400">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Trades</th>
              <th className="px-4 py-3 font-medium">Gross</th>
              <th className="px-4 py-3 font-medium">Charges</th>
              <th className="px-4 py-3 font-medium">Net</th>
              <th className="px-4 py-3 font-medium">Tags</th>
            </tr>
          </thead>

          <tbody>
            {rows.length ? (
              rows.map((row) => (
                <tr
                  key={row._id}
                  className="border-b border-white/5 text-sm text-slate-300 transition hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-4 text-white">{formatDisplayDate(row.date)}</td>
                  <td className="px-4 py-4">{row.numberOfTrades}</td>
                  <td className="px-4 py-4">{formatSignedInr(row.outcome)}</td>
                  <td className="px-4 py-4 text-amber-300">
                    {formatSignedInr(-Math.abs(row.charges))}
                  </td>
                  <td
                    className={`px-4 py-4 font-semibold ${
                      row.netPnl >= 0 ? "text-emerald-300" : "text-rose-300"
                    }`}
                  >
                    {formatSignedInr(row.netPnl)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {row.tags.length ? (
                        row.tags.map((tag) => (
                          <span
                            key={`${row._id}-${tag}`}
                            className="rounded-full border border-cyan-400/15 bg-cyan-400/8 px-2.5 py-1 text-xs text-cyan-200"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                  No trading days found for this period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {rows.length ? (
          rows.map((row) => (
            <div
              key={row._id}
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">
                    {formatDisplayDate(row.date)}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {row.numberOfTrades} trades
                  </div>
                </div>

                <div
                  className={`text-sm font-semibold ${
                    row.netPnl >= 0 ? "text-emerald-300" : "text-rose-300"
                  }`}
                >
                  {formatSignedInr(row.netPnl)}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-400">
                <div>
                  <div>Gross</div>
                  <div className="mt-1 text-sm text-slate-200">{formatSignedInr(row.outcome)}</div>
                </div>
                <div>
                  <div>Charges</div>
                  <div className="mt-1 text-sm text-amber-300">
                    {formatSignedInr(-Math.abs(row.charges))}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {row.tags.length ? (
                  row.tags.map((tag) => (
                    <span
                      key={`${row._id}-${tag}`}
                      className="rounded-full border border-cyan-400/15 bg-cyan-400/8 px-2.5 py-1 text-[11px] text-cyan-200"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">No tags</span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-slate-500">
            No trading days found for this period.
          </div>
        )}
      </div>
    </DashboardPanel>
  );
}