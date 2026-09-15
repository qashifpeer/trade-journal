"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type TradeTag = {
  _id: string;
  title: string;
  value: string;
};

type TradeListItem = {
  _id: string;
  date: string;
  trade: string;
  netPnl: number;
  charges: number;
  tags: TradeTag[];
};

type TradesResponse = {
  ok?: boolean;
  trades?: TradeListItem[];
  error?: string;
};

type MessageType = "success" | "error" | "";

type TradeTotals = {
  totalTrades: number;
  netPnl: number;
  charges: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function pnlColor(value: number) {
  if (value > 0) {
    return "text-emerald-600 dark:text-emerald-400";
  }

  if (value < 0) {
    return "text-rose-600 dark:text-rose-400";
  }

  return "text-slate-700 dark:text-slate-200";
}

function pnlCardClass(value: number) {
  if (value > 0) {
    return "border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/30";
  }

  if (value < 0) {
    return "border-rose-200 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/30";
  }

  return "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60";
}

function pnlBadgeClass(value: number) {
  if (value > 0) {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  if (value < 0) {
    return "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300";
  }

  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

function DeleteIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 6h18"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 6V4h8v2"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 6l-1 14H6L5 6"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 11v5M14 11v5"
      />
    </svg>
  );
}

export default function TradeListPage() {
  const [trades, setTrades] = useState<TradeListItem[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("");

  const inputBase =
    "rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-slate-500";

  const totals = useMemo<TradeTotals>(() => {
    return trades.reduce(
      (summary, trade) => {
        summary.totalTrades += 1;
        summary.netPnl += Number(trade.netPnl) || 0;
        summary.charges += Number(trade.charges) || 0;

        return summary;
      },
      {
        totalTrades: 0,
        netPnl: 0,
        charges: 0,
      },
    );
  }, [trades]);

  const loadTrades = useCallback(async () => {
    if (startDate && endDate && startDate > endDate) {
      setTrades([]);
      setLoading(false);
      setMessage("Start date cannot be later than end date");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setMessageType("");

      const params = new URLSearchParams();

      if (startDate) {
        params.set("startDate", startDate);
      }

      if (endDate) {
        params.set("endDate", endDate);
      }

      const queryString = params.toString();

      const response = await fetch(
        `/api/savetrade${queryString ? `?${queryString}` : ""}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data = (await response.json()) as TradesResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to load trades");
      }

      setTrades(Array.isArray(data.trades) ? data.trades : []);
    } catch (error) {
      setTrades([]);
      setMessage(
        error instanceof Error ? error.message : "Failed to load trades",
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadTrades();
  }, [loadTrades]);

  function clearFilters() {
    setStartDate("");
    setEndDate("");
  }

  async function handleDelete(tradeId: string, tradeName: string) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${tradeName}"? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(tradeId);
      setMessage("");
      setMessageType("");

      const response = await fetch(`/api/savetrade/${tradeId}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to delete trade");
      }

      setTrades((currentTrades) =>
        currentTrades.filter((trade) => trade._id !== tradeId),
      );

      setMessage("Trade deleted successfully");
      setMessageType("success");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to delete trade",
      );
      setMessageType("error");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Trade List
          </h1>

          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            View, filter, and manage your saved trades.
          </p>
        </header>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Filter by date
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Select a start date, end date, or both.
            </p>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <label
                htmlFor="start-date"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                From date
              </label>

              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className={`${inputBase} w-full`}
              />
            </div>

            <div className="flex-1">
              <label
                htmlFor="end-date"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                To date
              </label>

              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className={`${inputBase} w-full`}
              />
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Clear Filters
            </button>
          </div>
        </section>

        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Total Trades
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {totals.totalTrades}
            </p>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Based on the active date range
            </p>
          </div>

          <div
            className={`rounded-2xl border p-5 shadow-sm ${pnlCardClass(
              totals.netPnl,
            )}`}
          >
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Total Net P&amp;L
            </p>

            <p
              className={`mt-2 text-2xl font-bold ${pnlColor(
                totals.netPnl,
              )}`}
            >
              {formatCurrency(totals.netPnl)}
            </p>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Based on the active date range
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Total Charges
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(totals.charges)}
            </p>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Based on the active date range
            </p>
          </div>
        </section>

        {message ? (
          <div
            role="status"
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              messageType === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
                : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300"
            }`}
          >
            {message}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Loading trades...
            </div>
          ) : trades.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-medium text-slate-700 dark:text-slate-200">
                No trades found
              </p>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Try changing the date range or save a new trade.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[850px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left dark:border-slate-800 dark:bg-slate-800/70">
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Date
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Contract
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Net P&amp;L
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Charges
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Tags
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {trades.map((trade) => (
                      <tr
                        key={trade._id}
                        className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                      >
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
                          {trade.date}
                        </td>

                        <td className="max-w-[280px] px-5 py-4">
                          <p className="break-words font-medium text-slate-900 dark:text-slate-100">
                            {trade.trade}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-sm font-semibold ${pnlBadgeClass(
                              trade.netPnl,
                            )}`}
                          >
                            <span className={pnlColor(trade.netPnl)}>
                              {formatCurrency(trade.netPnl)}
                            </span>
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
                          {formatCurrency(trade.charges)}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex max-w-[220px] flex-wrap gap-1.5">
                            {trade.tags?.length ? (
                              trade.tags.map((tag) => (
                                <span
                                  key={`${trade._id}-${tag._id}`}
                                  className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
                                >
                                  {tag.title}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-slate-400">
                                No tags
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            aria-label={`Delete ${trade.trade}`}
                            title="Delete trade"
                            disabled={deletingId === trade._id}
                            onClick={() =>
                              handleDelete(trade._id, trade.trade)
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                          >
                            {deletingId === trade._id ? (
                              <span className="text-xs">...</span>
                            ) : (
                              <DeleteIcon />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-200 md:hidden dark:divide-slate-800">
                {trades.map((trade) => (
                  <article key={trade._id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {trade.date}
                        </p>

                        <h3 className="mt-1 break-words font-semibold text-slate-900 dark:text-slate-100">
                          {trade.trade}
                        </h3>
                      </div>

                      <button
                        type="button"
                        aria-label={`Delete ${trade.trade}`}
                        title="Delete trade"
                        disabled={deletingId === trade._id}
                        onClick={() =>
                          handleDelete(trade._id, trade.trade)
                        }
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                      >
                        {deletingId === trade._id ? (
                          <span className="text-xs">...</span>
                        ) : (
                          <DeleteIcon />
                        )}
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Net P&amp;L
                        </p>

                        <p
                          className={`mt-1 font-semibold ${pnlColor(
                            trade.netPnl,
                          )}`}
                        >
                          {formatCurrency(trade.netPnl)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Charges
                        </p>

                        <p className="mt-1 font-semibold text-slate-700 dark:text-slate-200">
                          {formatCurrency(trade.charges)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {trade.tags?.length ? (
                        trade.tags.map((tag) => (
                          <span
                            key={`${trade._id}-${tag._id}`}
                            className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
                          >
                            {tag.title}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-400">
                          No tags
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}