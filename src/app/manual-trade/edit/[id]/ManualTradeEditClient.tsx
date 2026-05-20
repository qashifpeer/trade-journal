"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const STRATEGY_OPTIONS = [
  "Breakout",
  "SL Hunting",
  "FIB Pullback",
  "Reversal",
  "Sniper",
  "Other",
];

const MISTAKE_OPTIONS = [
  "over trading",
  "revenge trading",
  "fomo entry",
  "risked too much",
  "greedy",
  "early exit",
  "no clear plans",
  "ignored stop loss",
  "no mistake",
];

const OUTCOME_OPTIONS = [
  { label: "Mistake", value: "mistake" },
  { label: "Followed Plan", value: "followed plan" },
  { label: "Full Success", value: "full success" },
  { label: "Partial Success", value: "partial success" },
] as const;

type Direction = "Long" | "Short";

type TradeResponse = {
  _id: string;
  fyersTradeId: string;
  symbol: string;
  direction: Direction;
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  entryTime: string;
  exitTime: string;
  pnl: number;
  tradeDate: string;
  setup?: string;
  outcome?: string;
  tags?: string[];
  marketCondition?: string;
  emotionalState?: string;
  notes?: string;
  mistakes?: string[];
  lessons?: string;
};

type ManualTradeForm = {
  symbol: string;
  direction: Direction;
  quantity: string;
  entryPrice: string;
  exitPrice: string;
  tradeDate: string;
  entryTime: string;
  exitTime: string;
  setup: string;
  tags: string;
  notes: string;
  mistakes: string[];
  lessons: string;
  emotionalState: string;
  marketCondition: string;
  outcome: string;
};

function formatToDateTimeLocal(value: string) {
  if (!value) return "";

  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) {
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  }

  return "";
}

function formatDateTimeForStorage(value: string) {
  if (!value) return "";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export default function ManualTradeEditClient({
  tradeId,
}: {
  tradeId: string;
}) {
  const router = useRouter();

  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [fyersTradeId, setFyersTradeId] = useState("");

  const [form, setForm] = useState<ManualTradeForm>({
    symbol: "",
    direction: "Long",
    quantity: "",
    entryPrice: "",
    exitPrice: "",
    tradeDate: "",
    entryTime: "",
    exitTime: "",
    setup: "",
    tags: "",
    notes: "",
    mistakes: [],
    lessons: "",
    emotionalState: "",
    marketCondition: "",
    outcome: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function loadTrade() {
      try {
        setPageLoading(true);
        setError("");

        const res = await fetch(`/api/sanity/manual-trade/${tradeId}`, {
          cache: "no-store",
        });

        const data = await res.json();

        if (cancelled) return;

        if (!res.ok || !data.success) {
          setError(data.error || "Failed to load trade");
          setPageLoading(false);
          return;
        }

        const trade: TradeResponse = data.trade;

        setFyersTradeId(trade.fyersTradeId || "");

        setForm({
          symbol: trade.symbol || "",
          direction: trade.direction || "Long",
          quantity: String(trade.quantity ?? ""),
          entryPrice: String(trade.entryPrice ?? ""),
          exitPrice: String(trade.exitPrice ?? ""),
          tradeDate: trade.tradeDate || "",
          entryTime: formatToDateTimeLocal(trade.entryTime),
          exitTime: formatToDateTimeLocal(trade.exitTime),
          setup: trade.setup || "",
          tags: Array.isArray(trade.tags) ? trade.tags.join(", ") : "",
          notes: trade.notes || "",
          mistakes: Array.isArray(trade.mistakes) ? trade.mistakes : [],
          lessons: trade.lessons || "",
          emotionalState: trade.emotionalState || "",
          marketCondition: trade.marketCondition || "",
          outcome: trade.outcome || "",
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load trade");
        }
      } finally {
        if (!cancelled) {
          setPageLoading(false);
        }
      }
    }

    loadTrade();

    return () => {
      cancelled = true;
    };
  }, [tradeId]);

  const quantity = Number(form.quantity || 0);
  const entryPrice = Number(form.entryPrice || 0);
  const exitPrice = Number(form.exitPrice || 0);

  const pnl = useMemo(() => {
    if (!quantity || !entryPrice || !exitPrice) return 0;

    const diff =
      form.direction === "Long"
        ? exitPrice - entryPrice
        : entryPrice - exitPrice;

    return diff * quantity;
  }, [form.direction, quantity, entryPrice, exitPrice]);

  const handleChange = (
    field: keyof ManualTradeForm,
    value: string | string[]
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleMistake = (value: string) => {
    setForm((prev) => ({
      ...prev,
      mistakes: prev.mistakes.includes(value)
        ? prev.mistakes.filter((m) => m !== value)
        : [...prev.mistakes, value],
    }));
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      if (!form.symbol.trim()) {
        setError("Symbol is required.");
        setLoading(false);
        return;
      }

      if (!form.tradeDate) {
        setError("Trade date is required.");
        setLoading(false);
        return;
      }

      if (!form.quantity || Number(form.quantity) <= 0) {
        setError("Quantity must be greater than 0.");
        setLoading(false);
        return;
      }

      if (!form.entryPrice || Number(form.entryPrice) <= 0) {
        setError("Entry price must be greater than 0.");
        setLoading(false);
        return;
      }

      if (!form.exitPrice || Number(form.exitPrice) <= 0) {
        setError("Exit price must be greater than 0.");
        setLoading(false);
        return;
      }

      const payload = {
        fyersTradeId: fyersTradeId || `MANUAL-${Date.now()}`,
        symbol: form.symbol.trim().toUpperCase(),
        direction: form.direction,
        quantity: Number(form.quantity),
        entryPrice: Number(form.entryPrice),
        exitPrice: Number(form.exitPrice),
        entryTime: formatDateTimeForStorage(form.entryTime),
        exitTime: formatDateTimeForStorage(form.exitTime),
        pnl,
        setup: form.setup,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        notes: form.notes,
        mistakes: form.mistakes,
        lessons: form.lessons,
        emotionalState: form.emotionalState,
        marketCondition: form.marketCondition,
        outcome: form.outcome,
        tradeDate: form.tradeDate,
      };

      const res = await fetch(`/api/sanity/manual-trade/${tradeId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to update trade");
        setLoading(false);
        return;
      }

      setSuccessMessage("Trade updated successfully.");

      setTimeout(() => {
        router.push(`/trade-details/${tradeId}`);
        router.refresh();
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update trade");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0f1f] text-white">
        Loading trade...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0f1f] bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.10),_transparent_30%),radial-gradient(circle_at_right,_rgba(168,85,247,0.10),_transparent_25%),linear-gradient(180deg,_#0a0f1f_0%,_#0b1120_100%)] px-4 py-10 text-white md:px-6">
      <style jsx global>{`
        select,
        select option {
          background-color: #0f172a;
          color: #e2e8f0;
        }

        select option:hover,
        select option:focus,
        select option:checked {
          background-color: #155e75;
          color: #f8fafc;
        }
      `}</style>

      <div className="mx-auto max-w-4xl">
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-[0_0_40px_rgba(34,211,238,0.06)]">
          <p className="mb-2 text-xs uppercase tracking-[0.22em] text-cyan-300/80">
            Trade Journal
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Edit Trade</h1>
          <p className="mt-2 text-sm text-slate-400">
            Update your trade details and keep the psychology review intact.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-300">
            {successMessage}
          </div>
        )}

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Trade Details
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm text-slate-400">Symbol</label>
                <input
                  type="text"
                  value={form.symbol}
                  onChange={(e) => handleChange("symbol", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2 text-white uppercase outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400">Direction</label>
                <select
                  value={form.direction}
                  onChange={(e) => handleChange("direction", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-slate-900/80 px-4 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30"
                >
                  <option value="Long">Long</option>
                  <option value="Short">Short</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400">Trade Date</label>
                <input
                  type="date"
                  value={form.tradeDate}
                  onChange={(e) => handleChange("tradeDate", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2 text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400">Quantity</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.quantity}
                  onChange={(e) => handleChange("quantity", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2 text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400">Entry Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.entryPrice}
                  onChange={(e) => handleChange("entryPrice", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2 text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400">Exit Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.exitPrice}
                  onChange={(e) => handleChange("exitPrice", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2 text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400">Entry Time</label>
                <input
                  type="datetime-local"
                  value={form.entryTime}
                  onChange={(e) => handleChange("entryTime", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2 text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400">Exit Time</label>
                <input
                  type="datetime-local"
                  value={form.exitTime}
                  onChange={(e) => handleChange("exitTime", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2 text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-slate-400">P&amp;L</label>
                <div
                  className={`mt-1 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 font-mono text-lg font-semibold ${
                    pnl >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {pnl >= 0 ? "+" : "-"}₹{Math.abs(pnl).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Additional Details
            </h2>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Setup / Strategy
                </label>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {STRATEGY_OPTIONS.map((strategy) => (
                    <button
                      key={strategy}
                      type="button"
                      onClick={() => handleChange("setup", strategy)}
                      className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                        form.setup === strategy
                          ? "bg-cyan-500 text-white ring-2 ring-cyan-400"
                          : "bg-slate-800 text-slate-300 hover:bg-cyan-500/80 hover:text-white"
                      }`}
                    >
                      {strategy}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => handleChange("tags", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2 text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Market Condition
                </label>
                <select
                  value={form.marketCondition}
                  onChange={(e) =>
                    handleChange("marketCondition", e.target.value)
                  }
                  className="mt-1 w-full rounded-xl border border-white/15 bg-slate-900/80 px-4 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30"
                >
                  <option value="">Select...</option>
                  <option value="trending">Trending</option>
                  <option value="ranging">Ranging</option>
                  <option value="volatile">Volatile</option>
                  <option value="calm">Calm</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Emotional State
                </label>
                <select
                  value={form.emotionalState}
                  onChange={(e) =>
                    handleChange("emotionalState", e.target.value)
                  }
                  className="mt-1 w-full rounded-xl border border-white/15 bg-slate-900/80 px-4 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30"
                >
                  <option value="">Select...</option>
                  <option value="confident">Confident</option>
                  <option value="calm">Calm</option>
                  <option value="anxious">Anxious</option>
                  <option value="fearful">Fearful</option>
                  <option value="greedy">Greedy</option>
                  <option value="frustrated">Frustrated</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Outcome
                </label>
                <select
                  value={form.outcome}
                  onChange={(e) => handleChange("outcome", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-slate-900/80 px-4 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30"
                >
                  <option value="">Select...</option>
                  {OUTCOME_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Trade Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2 text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Mistakes
                </label>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {MISTAKE_OPTIONS.map((item) => {
                    const selected = form.mistakes.includes(item);
                    const label = item
                      .split(" ")
                      .map((w) => w[0].toUpperCase() + w.slice(1))
                      .join(" ");

                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleMistake(item)}
                        className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                          selected
                            ? "bg-red-500/90 text-white ring-2 ring-red-400"
                            : "bg-slate-800 text-slate-300 hover:bg-red-500/70 hover:text-white"
                        }`}
                      >
                        <span className="truncate">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Lessons Learned
                </label>
                <textarea
                  value={form.lessons}
                  onChange={(e) => handleChange("lessons", e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2 text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-slate-200 transition-colors hover:bg-white/10"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleUpdate}
              disabled={loading}
              className="flex-1 rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950 transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Updating..." : "Update Trade"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}