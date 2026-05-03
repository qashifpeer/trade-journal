// src/components/dashboard/trades-table.tsx
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  ListFilter,
  Table2,
} from "lucide-react";
import type { Trade } from "@/src/types/trade";

type Props = {
  trades: Trade[];
};

function getOutcomeTone(outcome?: string) {
  switch (outcome) {
    case "full success":
      return "border-emerald-300/20 bg-emerald-400/10 text-emerald-300";
    case "partial success":
      return "border-cyan-300/20 bg-cyan-400/10 text-cyan-300";
    case "followed plan":
      return "border-violet-300/20 bg-violet-400/10 text-violet-300";
    case "mistake":
      return "border-pink-300/20 bg-pink-400/10 text-pink-300";
    default:
      return "border-white/10 bg-white/5 text-slate-300";
  }
}

function getPnLClass(pnl: number) {
  if (pnl > 0) return "text-emerald-300";
  if (pnl < 0) return "text-rose-300";
  return "text-slate-300";
}

export function TradesTable({ trades }: Props) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_40px_rgba(34,211,238,0.06)]">
      <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10">
            <Table2 className="h-5 w-5 text-cyan-300" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white">Recent Trades</h2>
            <p className="text-sm text-slate-400">
              Filtered trades for the selected month and year
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-violet-300/15 bg-violet-400/5 px-3 py-2 text-violet-200">
          <ListFilter className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-[0.18em]">
            Journal View
          </span>
        </div>
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-white/10 text-left">
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Symbol
              </th>
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Date
              </th>
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Direction
              </th>
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Setup
              </th>
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Outcome
              </th>
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                P&L
              </th>
              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {trades.length > 0 ? (
              trades.map((trade) => (
                <tr
                  key={trade._id}
                  className="border-b border-white/5 transition hover:bg-white/[0.03]"
                >
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-medium text-white">{trade.symbol}</p>
                      <p className="text-xs text-slate-500">{trade.fyersTradeId}</p>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-300">
                    {trade.tradeDate}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
                        trade.direction === "Long"
                          ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-300"
                          : "border-rose-300/20 bg-rose-400/10 text-rose-300"
                      }`}
                    >
                      {trade.direction === "Long" ? (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5" />
                      )}
                      {trade.direction}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-300">
                    {trade.setup || "—"}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getOutcomeTone(
                        trade.outcome
                      )}`}
                    >
                      {trade.outcome || "—"}
                    </span>
                  </td>

                  <td
                    className={`px-5 py-4 text-sm font-semibold ${getPnLClass(
                      trade.pnl
                    )}`}
                  >
                    {trade.pnl > 0 ? "+" : ""}
                    ₹{trade.pnl.toFixed(2)}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/trade-details/${trade._id}`}
                      className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-200 transition hover:border-cyan-300/40 hover:bg-cyan-400/15"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      View details
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400">
                  No trades found for this period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-4 lg:hidden">
        {trades.length > 0 ? (
          trades.map((trade) => (
            <div
              key={trade._id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium text-white">{trade.symbol}</h3>
                  <p className="mt-1 text-xs text-slate-500">{trade.tradeDate}</p>
                </div>

                <span
                  className={`text-sm font-semibold ${getPnLClass(trade.pnl)}`}
                >
                  {trade.pnl > 0 ? "+" : ""}
                  ₹{trade.pnl.toFixed(2)}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${
                    trade.direction === "Long"
                      ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-300"
                      : "border-rose-300/20 bg-rose-400/10 text-rose-300"
                  }`}
                >
                  {trade.direction === "Long" ? (
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5" />
                  )}
                  {trade.direction}
                </span>

                {trade.setup ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                    {trade.setup}
                  </span>
                ) : null}

                {trade.outcome ? (
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${getOutcomeTone(
                      trade.outcome
                    )}`}
                  >
                    {trade.outcome}
                  </span>
                ) : null}
              </div>

              <div className="mt-4">
                <Link
                  href={`/trade-details/${trade._id}`}
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-200"
                >
                  <FileText className="h-3.5 w-3.5" />
                  View details
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-6 text-sm text-slate-400">
            No trades found for this period.
          </div>
        )}
      </div>
    </section>
  );
}