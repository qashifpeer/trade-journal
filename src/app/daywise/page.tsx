"use client";

import { useEffect, useMemo, useState } from "react";

type TagItem = {
  _id?: string;
  title: string;
  value: string;
};

type DaywiseTradeItem = {
  _id: string;
  date: string;
  numberOfTrades: number;
  outcome: number;
  charges: number;
  netPnl: number;
  notes: string;
  tags: TagItem[];
  indexImageUrl?: string;
  tradesImageUrl?: string;
};

type DaywiseResponse = {
  ok: boolean;
  month: string;
  items: DaywiseTradeItem[];
};

function getCurrentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function pnlColor(value: number) {
  if (value > 0) return "text-emerald-600 dark:text-emerald-400";
  if (value < 0) return "text-rose-600 dark:text-rose-400";
  return "text-slate-900 dark:text-slate-100";
}

async function readJsonSafely<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Server returned invalid JSON");
  }
}

function buildMonthOptions(count = 12) {
  const now = new Date();
  const options: { value: string; label: string }[] = [];

  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const value = `${year}-${month}`;
    const label = d.toLocaleString("en-IN", {
      month: "long",
      year: "numeric",
    });
    options.push({ value, label });
  }

  return options;
}

export default function DaywisePage() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [items, setItems] = useState<DaywiseTradeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedTrade, setSelectedTrade] = useState<DaywiseTradeItem | null>(
    null,
  );

  const monthOptions = useMemo(() => buildMonthOptions(18), []);

  const monthPnl = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.netPnl) || 0), 0);
  }, [items]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMonthData() {
      try {
        setLoading(true);
        setMessage("");

        const res = await fetch(
          `/api/intraday/daywise?month=${encodeURIComponent(selectedMonth)}`,
          { signal: controller.signal },
        );

        const data = await readJsonSafely<DaywiseResponse>(res);

        if (!res.ok || !data?.ok) {
          setItems([]);
          setMessage("Failed to load trades");
          return;
        }

        setItems(Array.isArray(data.items) ? data.items : []);
      } catch {
        setItems([]);
        setMessage("Failed to load trades");
      } finally {
        setLoading(false);
      }
    }

    loadMonthData();

    return () => controller.abort();
  }, [selectedMonth]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Daywise Trades
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              View all trades for the selected month and open full trade details
              with images.
            </p>
          </div>

          <div className="w-full md:w-64">
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Select month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-black outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-slate-500"
            >
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Selected Month
            </p>
            <p className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">
              {monthOptions.find((m) => m.value === selectedMonth)?.label ??
                selectedMonth}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Total Entries
            </p>
            <p className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">
              {items.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              PNL For Month
            </p>
            <p className={`mt-2 text-2xl font-bold ${pnlColor(monthPnl)}`}>
              {monthPnl}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Monthly trade list
            </p>
          </div>

          {loading ? (
            <div className="px-5 py-6 text-sm text-slate-600 dark:text-slate-300">
              Loading trades...
            </div>
          ) : message ? (
            <div className="px-5 py-6 text-sm text-rose-600 dark:text-rose-300">
              {message}
            </div>
          ) : items.length === 0 ? (
            <div className="px-5 py-6 text-sm text-slate-600 dark:text-slate-300">
              No trades found for this month.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      S.No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Trade Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Total Trades
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Net PNL
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Tags
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      View Trade
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item, index) => (
                    <tr
                      key={item._id}
                      className="border-b border-slate-100 last:border-b-0 dark:border-slate-800"
                    >
                      <td className="px-4 py-4 text-sm text-slate-700 dark:text-slate-300">
                        {index + 1}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-slate-900 dark:text-slate-100">
                        {item.date}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700 dark:text-slate-300">
                        {item.numberOfTrades}
                      </td>
                      <td
                        className={`px-4 py-4 text-sm font-semibold ${pnlColor(item.netPnl)}`}
                      >
                        {item.netPnl}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          {item.tags?.length ? (
                            item.tags.map((tag) => (
                              <span
                                key={tag._id ?? tag.value}
                                className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
                              >
                                {tag.title}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                              —
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => setSelectedTrade(item)}
                          className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                        >
                          View Trade
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedTrade ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 md:p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    Trade Details
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {selectedTrade.date}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTrade(null)}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Close
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Total Trades
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {selectedTrade.numberOfTrades}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Net PNL
                  </p>
                  <p
                    className={`mt-1 text-lg font-semibold ${pnlColor(selectedTrade.netPnl)}`}
                  >
                    {selectedTrade.netPnl}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Outcome
                  </p>
                  <p
                    className={`mt-1 text-lg font-semibold ${pnlColor(selectedTrade.outcome)}`}
                  >
                    {selectedTrade.outcome}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Charges
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {selectedTrade.charges}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Tags
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedTrade.tags?.length ? (
                    selectedTrade.tags.map((tag) => (
                      <span
                        key={tag._id ?? tag.value}
                        className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
                      >
                        {tag.title}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      No tags
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Notes
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">
                  {selectedTrade.notes || "No notes added."}
                </p>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Index Image
                  </p>
                  {selectedTrade.indexImageUrl ? (
                    <img
                      src={selectedTrade.indexImageUrl}
                      alt="Index trade chart"
                      className="mt-3 h-64 w-full rounded-xl object-cover"
                    />
                  ) : (
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      No index image.
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Trades Image
                  </p>
                  {selectedTrade.tradesImageUrl ? (
                    <img
                      src={selectedTrade.tradesImageUrl}
                      alt="Trades screenshot"
                      className="mt-3 h-64 w-full rounded-xl object-cover"
                    />
                  ) : (
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      No trades image.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}