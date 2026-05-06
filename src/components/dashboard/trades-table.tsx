// src/components/dashboard/trades-table.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  ListFilter,
  Table2,
  ChevronDown,
  X,
} from "lucide-react";
import type { Trade } from "@/src/types/trade";

type Props = {
  trades: Trade[];
};

type SortOption =
  | "HIGHEST_PNL"
  | "LOWEST_PNL"
  | "NEWEST_FIRST"
  | "OLDEST_FIRST";

type DirectionFilter = "both" | "long" | "short";

type TradesFilterState = {
  startDate?: string;
  endDate?: string;
  strategies: string[];
  direction: DirectionFilter;
  outcomes: string[];
};

const defaultFilters: TradesFilterState = {
  startDate: undefined,
  endDate: undefined,
  strategies: [],
  direction: "both",
  outcomes: [],
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

function formatTradeSymbol(symbol?: string) {
  if (!symbol) return "—";

  const cleaned = symbol.replace(/^NSE:/, "");
  const optionTypeMatch = cleaned.match(/(CE|PE)$/);
  const strikeMatch = cleaned.match(/(\d{5})(CE|PE)$/);

  const optionType = optionTypeMatch?.[1] ?? "";
  const strike = strikeMatch?.[1] ?? "";

  let base = cleaned;

  if (strike && optionType) {
    base = cleaned.replace(new RegExp(`${strike}${optionType}$`), "");
  } else if (optionType) {
    base = cleaned.replace(new RegExp(`${optionType}$`), "");
  }

  const underlying = base.replace(/\d+$/, "");

  if (!underlying) return cleaned;
  if (!strike || !optionType) return underlying;

  return `${underlying}-${strike}-${optionType}`;
}

function formatTimeOnly(value?: string) {
  if (!value) return "—";

  const match = value.match(/(\d{2}):(\d{2})/);
  if (match) {
    return `${match[1]}:${match[2]}`;
  }

  return value;
}

// If your Trade uses buyTime/sellTime instead, swap entryTime/exitTime here.
function getTradeTimeRange(trade: Trade) {
  const entryTime = formatTimeOnly((trade as any).entryTime ?? (trade as any).buyTime);
  const exitTime = formatTimeOnly((trade as any).exitTime ?? (trade as any).sellTime);

  if (entryTime === "—" && exitTime === "—") return "—";
  if (entryTime !== "—" && exitTime !== "—") return `${entryTime}   ${exitTime}`;
  if (entryTime !== "—") return entryTime;

  return exitTime;
}

function sortTrades(trades: Trade[], sortBy: SortOption): Trade[] {
  const cloned = [...trades];

  switch (sortBy) {
    case "HIGHEST_PNL":
      return cloned.sort((a, b) => (b.pnl ?? 0) - (a.pnl ?? 0));
    case "LOWEST_PNL":
      return cloned.sort((a, b) => (a.pnl ?? 0) - (b.pnl ?? 0));
    case "NEWEST_FIRST":
      return cloned.sort(
        (a, b) =>
          new Date(b.tradeDate ?? "").getTime() -
          new Date(a.tradeDate ?? "").getTime()
      );
    case "OLDEST_FIRST":
      return cloned.sort(
        (a, b) =>
          new Date(a.tradeDate ?? "").getTime() -
          new Date(b.tradeDate ?? "").getTime()
      );
    default:
      return cloned;
  }
}

function filterTrades(trades: Trade[], filters: TradesFilterState): Trade[] {
  return trades.filter((trade) => {
    const tradeDate = trade.tradeDate
      ? new Date(trade.tradeDate)
      : undefined;

    if (filters.startDate) {
      const start = new Date(filters.startDate);
      if (!tradeDate || tradeDate < start) return false;
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate);
      if (!tradeDate || tradeDate > end) return false;
    }

    if (filters.strategies.length > 0) {
      const strategy = trade.setup ?? "";
      if (!filters.strategies.includes(strategy)) return false;
    }

    if (filters.direction !== "both") {
      if (filters.direction === "long" && trade.direction !== "Long") {
        return false;
      }
      if (filters.direction === "short" && trade.direction !== "Short") {
        return false;
      }
    }

    if (filters.outcomes.length > 0) {
      const outcome = trade.outcome ?? "";
      if (!filters.outcomes.includes(outcome)) return false;
    }

    return true;
  });
}

function getUniqueStrategies(trades: Trade[]): string[] {
  const set = new Set<string>();
  for (const t of trades) {
    if (t.setup) set.add(t.setup);
  }
  return Array.from(set).sort();
}

function getUniqueOutcomes(trades: Trade[]): string[] {
  const set = new Set<string>();
  for (const t of trades) {
    if (t.outcome) set.add(t.outcome);
  }
  return Array.from(set).sort();
}

export function TradesTable({ trades }: Props) {
  const [sortBy, setSortBy] = useState<SortOption>("NEWEST_FIRST");
  const [filters, setFilters] = useState<TradesFilterState>(defaultFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const strategies = useMemo(() => getUniqueStrategies(trades), [trades]);
  const outcomes = useMemo(() => getUniqueOutcomes(trades), [trades]);

  const filteredAndSortedTrades = useMemo(() => {
    const filtered = filterTrades(trades, filters);
    return sortTrades(filtered, sortBy);
  }, [trades, filters, sortBy]);

  const hasActiveFilters =
    filters.startDate ||
    filters.endDate ||
    filters.direction !== "both" ||
    filters.strategies.length > 0 ||
    filters.outcomes.length > 0;

  const resetFilters = () => setFilters(defaultFilters);

  const toggleStrategy = (strategy: string) => {
    setFilters((prev) => {
      const exists = prev.strategies.includes(strategy);
      return {
        ...prev,
        strategies: exists
          ? prev.strategies.filter((s) => s !== strategy)
          : [...prev.strategies, strategy],
      };
    });
  };

  const toggleOutcome = (outcome: string) => {
    setFilters((prev) => {
      const exists = prev.outcomes.includes(outcome);
      return {
        ...prev,
        outcomes: exists
          ? prev.outcomes.filter((o) => o !== outcome)
          : [...prev.outcomes, outcome],
      };
    });
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_40px_rgba(34,211,238,0.06)]">
      {/* Header with sort + filter */}
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

        <div className="flex flex-wrap items-center gap-3">
          {/* Sort dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsSortOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-500/40 bg-slate-900/60 px-3 py-2 text-xs font-medium text-slate-200 hover:border-slate-300/60"
            >
              <span className="uppercase tracking-[0.18em] text-[10px] text-slate-400">
                Sort
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {isSortOpen && (
              <div className="absolute right-0 z-20 mt-2 w-48 rounded-2xl border border-white/10 bg-slate-900/95 p-1 text-xs text-slate-200 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setSortBy("HIGHEST_PNL");
                    setIsSortOpen(false);
                  }}
                  className={`block w-full rounded-xl px-3 py-2 text-left hover:bg-white/5 ${
                    sortBy === "HIGHEST_PNL" ? "bg-white/10" : ""
                  }`}
                >
                  Highest P&L
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSortBy("LOWEST_PNL");
                    setIsSortOpen(false);
                  }}
                  className={`block w-full rounded-xl px-3 py-2 text-left hover:bg-white/5 ${
                    sortBy === "LOWEST_PNL" ? "bg-white/10" : ""
                  }`}
                >
                  Lowest P&L
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSortBy("NEWEST_FIRST");
                    setIsSortOpen(false);
                  }}
                  className={`block w-full rounded-xl px-3 py-2 text-left hover:bg-white/5 ${
                    sortBy === "NEWEST_FIRST" ? "bg-white/10" : ""
                  }`}
                >
                  Newest First
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSortBy("OLDEST_FIRST");
                    setIsSortOpen(false);
                  }}
                  className={`block w-full rounded-xl px-3 py-2 text-left hover:bg-white/5 ${
                    sortBy === "OLDEST_FIRST" ? "bg-white/10" : ""
                  }`}
                >
                  Oldest First
                </button>
              </div>
            )}
          </div>

          {/* Filter pill */}
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-2 rounded-2xl border border-violet-300/15 bg-violet-400/5 px-3 py-2 text-violet-200"
          >
            <ListFilter className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-[0.18em]">
              Filters
            </span>
            {hasActiveFilters ? (
              <span className="rounded-full bg-violet-500/60 px-2 py-0.5 text-[10px] font-semibold text-white">
                Active
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* Filter dialog */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950/95 p-5 text-slate-100 shadow-[0_0_60px_rgba(34,211,238,0.2)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
                Filter Trades
              </h3>
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="rounded-full border border-slate-600/40 bg-slate-900/60 p-1 text-slate-400 hover:border-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
              {/* Date range */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Date Range
                </p>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400">
                      Start date
                    </label>
                    <input
                      type="date"
                      value={filters.startDate ?? ""}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          startDate: e.target.value || undefined,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-cyan-400/60"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400">
                      End date
                    </label>
                    <input
                      type="date"
                      value={filters.endDate ?? ""}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          endDate: e.target.value || undefined,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-cyan-400/60"
                    />
                  </div>
                </div>
              </div>

              {/* Trading strategy */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Trading Strategy
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {strategies.length === 0 ? (
                    <p className="text-[11px] text-slate-500">
                      No strategies saved yet.
                    </p>
                  ) : (
                    strategies.map((strategy) => {
                      const checked = filters.strategies.includes(strategy);
                      return (
                        <label
                          key={strategy}
                          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] ${
                            checked
                              ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-200"
                              : "border-white/15 bg-white/5 text-slate-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleStrategy(strategy)}
                            className="h-3 w-3 rounded border-slate-500 bg-slate-900 text-cyan-400"
                          />
                          <span>{strategy}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Trade direction */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Trade Direction
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                  {[
                    { label: "Both", value: "both" as DirectionFilter },
                    { label: "Long", value: "long" as DirectionFilter },
                    { label: "Short", value: "short" as DirectionFilter },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          direction: opt.value,
                        }))
                      }
                      className={`rounded-full border px-3 py-1 ${
                        filters.direction === opt.value
                          ? "border-emerald-400/70 bg-emerald-500/15 text-emerald-200"
                          : "border-white/15 bg-white/5 text-slate-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Outcome */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Outcome
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {outcomes.length === 0 ? (
                    <p className="text-[11px] text-slate-500">
                      No outcomes recorded yet.
                    </p>
                  ) : (
                    outcomes.map((outcome) => {
                      const checked = filters.outcomes.includes(outcome);
                      return (
                        <label
                          key={outcome}
                          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] ${
                            checked
                              ? "border-violet-400/70 bg-violet-500/15 text-violet-200"
                              : "border-white/15 bg-white/5 text-slate-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleOutcome(outcome)}
                            className="h-3 w-3 rounded border-slate-500 bg-slate-900 text-violet-400"
                          />
                          <span>{outcome}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-full border border-slate-500/50 bg-slate-900/70 px-4 py-2 text-xs font-medium text-slate-200 hover:border-slate-300"
              >
                Reset filters
              </button>
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="rounded-full border border-cyan-400/80 bg-cyan-500/20 px-4 py-2 text-xs font-semibold text-cyan-100 hover:border-cyan-300 hover:bg-cyan-500/30"
              >
                Apply filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-white/10 text-left">
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Date
              </th>
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Symbol
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
            {filteredAndSortedTrades.length > 0 ? (
              filteredAndSortedTrades.map((trade) => (
                <tr
                  key={trade._id}
                  className="border-b border-white/5 transition hover:bg-white/[0.03]"
                >
                  <td className="px-5 py-4 text-sm text-slate-300">
                    {trade.tradeDate || "—"}
                  </td>

                  <td className="px-5 py-4">
                    <div>
                      <p className="font-medium text-white">
                        {formatTradeSymbol(trade.symbol)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {getTradeTimeRange(trade)}
                      </p>
                    </div>
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
                <td
                  colSpan={7}
                  className="px-5 py-10 text-center text-sm text-slate-400"
                >
                  No trades found for this period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 p-4 lg:hidden">
        {filteredAndSortedTrades.length > 0 ? (
          filteredAndSortedTrades.map((trade) => (
            <div
              key={trade._id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500">
                    {trade.tradeDate || "—"}
                  </p>
                  <h3 className="mt-1 font-medium text-white">
                    {formatTradeSymbol(trade.symbol)}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {getTradeTimeRange(trade)}
                  </p>
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