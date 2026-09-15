"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function parseFyersDateToISO(fyersDate: string): string {
  const [datePart] = fyersDate.split(" ");
  if (!datePart) return new Date().toISOString().split("T")[0];

  const [day, monthStr, year] = datePart.split("-");

  const months: Record<string, string> = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    May: "05",
    Jun: "06",
    Jul: "07",
    Aug: "08",
    Sep: "09",
    Oct: "10",
    Nov: "11",
    Dec: "12",
  };

  const month = months[monthStr];
  if (!month || !day || !year) {
    return new Date().toISOString().split("T")[0];
  }

  return `${year}-${month}-${day.padStart(2, "0")}`;
}

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
];

type EditableTrade = {
  _id: string;
  fyersTradeId: string;
  symbol: string;
  direction: string;
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
  createdAt?: string;
};

type TradeMeta = {
  tradeId: string;
  symbol: string;
  direction: string;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  buyTime: string;
  sellTime: string;
  totalPnl: number;
};

type SaveTradeClientProps = {
  params: {
    sanityId?: string;
    id?: string;
    symbol?: string;
    direction?: string;
    quantity?: string;
    buyPrice?: string;
    sellPrice?: string;
    buyTime?: string;
    sellTime?: string;
    totalPnl?: string;
  };
};

const EMPTY_TRADE_META: TradeMeta = {
  tradeId: "",
  symbol: "",
  direction: "",
  quantity: 0,
  buyPrice: 0,
  sellPrice: 0,
  buyTime: "",
  sellTime: "",
  totalPnl: 0,
};

export default function SaveTradeClient({ params }: SaveTradeClientProps) {
  const router = useRouter();

  const sanityId = params.sanityId || "";
  const isEditMode = Boolean(sanityId);

  const initialFromQuery = useMemo(
    () => ({
      tradeId: params.id || "",
      symbol: params.symbol || "",
      direction: params.direction || "",
      quantity: params.quantity ? Number(params.quantity) : 0,
      buyPrice: params.buyPrice ? Number(params.buyPrice) : 0,
      sellPrice: params.sellPrice ? Number(params.sellPrice) : 0,
      buyTime: params.buyTime || "",
      sellTime: params.sellTime || "",
      totalPnl: params.totalPnl ? Number(params.totalPnl) : 0,
    }),
    [
      params.id,
      params.symbol,
      params.direction,
      params.quantity,
      params.buyPrice,
      params.sellPrice,
      params.buyTime,
      params.sellTime,
      params.totalPnl,
    ]
  );

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [tradeMeta, setTradeMeta] = useState<TradeMeta>(EMPTY_TRADE_META);

  const [setup, setSetup] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [lessons, setLessons] = useState("");
  const [emotionalState, setEmotionalState] = useState("");
  const [marketCondition, setMarketCondition] = useState("");
  const [outcome, setOutcome] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadTrade() {
      setError("");
      setSuccessMessage("");

      if (!isEditMode) {
        if (!cancelled) {
          setTradeMeta(initialFromQuery);
          setSetup("");
          setTags("");
          setNotes("");
          setMistakes([]);
          setLessons("");
          setEmotionalState("");
          setMarketCondition("");
          setOutcome("");
          setPageLoading(false);
        }
        return;
      }

      setPageLoading(true);

      try {
        const res = await fetch(`/api/sanity/trade/${sanityId}?t=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        });

        const data = await res.json();

        if (cancelled) return;

        if (!res.ok || !data.success) {
          setError(data.error || "Failed to load trade");
          setPageLoading(false);
          return;
        }

        const trade: EditableTrade = data.trade;

        setTradeMeta({
          tradeId: trade.fyersTradeId || "",
          symbol: trade.symbol || "",
          direction: trade.direction || "",
          quantity: trade.quantity || 0,
          buyPrice: trade.entryPrice || 0,
          sellPrice: trade.exitPrice || 0,
          buyTime: trade.entryTime || "",
          sellTime: trade.exitTime || "",
          totalPnl: trade.pnl || 0,
        });

        setSetup(trade.setup || "");
        setTags(Array.isArray(trade.tags) ? trade.tags.join(", ") : "");
        setNotes(trade.notes || "");
        setMistakes(Array.isArray(trade.mistakes) ? trade.mistakes : []);
        setLessons(trade.lessons || "");
        setEmotionalState(trade.emotionalState || "");
        setMarketCondition(trade.marketCondition || "");
        setOutcome(trade.outcome || "");
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
  }, [sanityId, isEditMode, initialFromQuery]);

  const toggleMistake = (value: string) => {
    setMistakes((prev) =>
      prev.includes(value) ? prev.filter((m) => m !== value) : [...prev, value]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const tradeDate = parseFyersDateToISO(tradeMeta.buyTime);

      const tradeData = {
        sanityId: isEditMode ? sanityId : undefined,
        fyersTradeId: tradeMeta.tradeId,
        symbol: tradeMeta.symbol,
        direction: tradeMeta.direction,
        quantity: tradeMeta.quantity,
        entryPrice: tradeMeta.buyPrice,
        exitPrice: tradeMeta.sellPrice,
        entryTime: tradeMeta.buyTime,
        exitTime: tradeMeta.sellTime,
        pnl: tradeMeta.totalPnl,
        setup,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        notes,
        mistakes,
        lessons,
        emotionalState,
        marketCondition,
        outcome,
        tradeDate,
        createdAt: isEditMode ? undefined : new Date().toISOString(),
      };

      const res = await fetch("/api/sanity/save-trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tradeData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to save trade");
        return;
      }

      const targetTradeId = data.tradeId || sanityId;

      setSuccessMessage(
        data.mode === "updated"
          ? "Journal entry updated successfully."
          : "Journal entry saved successfully."
      );

      setTimeout(() => {
        router.push(
          targetTradeId ? `/trade-details/${targetTradeId}` : "/trade-details"
        );
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save trade");
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
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditMode ? "Edit Trade Journal" : "Save Trade to Journal"}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {isEditMode
              ? "Update your journal notes, setup, mistakes, and trade context."
              : "Save this FYERS trade with your personal trading notes and review details."}
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
            <h2 className="mb-4 text-lg font-semibold text-white">FYERS Trade Data</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm text-slate-400">Symbol</label>
                <p className="mt-1 break-all font-mono text-lg text-white">
                  {tradeMeta.symbol}
                </p>
              </div>

              <div>
                <label className="text-sm text-slate-400">Direction</label>
                <p
                  className={`mt-1 text-lg font-semibold ${
                    tradeMeta.direction === "Long"
                      ? "text-emerald-400"
                      : "text-orange-400"
                  }`}
                >
                  {tradeMeta.direction}
                </p>
              </div>

              <div>
                <label className="text-sm text-slate-400">Quantity</label>
                <p className="mt-1 font-mono text-lg text-white">
                  {tradeMeta.quantity}
                </p>
              </div>

              <div>
                <label className="text-sm text-slate-400">Entry Price</label>
                <p className="mt-1 font-mono text-lg text-white">
                  ₹{tradeMeta.buyPrice.toFixed(2)}
                </p>
              </div>

              <div>
                <label className="text-sm text-slate-400">Exit Price</label>
                <p className="mt-1 font-mono text-lg text-white">
                  ₹{tradeMeta.sellPrice.toFixed(2)}
                </p>
              </div>

              <div>
                <label className="text-sm text-slate-400">P&amp;L</label>
                <p
                  className={`mt-1 font-mono text-lg font-semibold ${
                    tradeMeta.totalPnl >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {tradeMeta.totalPnl >= 0 ? "+" : "-"}₹
                  {Math.abs(tradeMeta.totalPnl).toFixed(2)}
                </p>
              </div>

              <div>
                <label className="text-sm text-slate-400">Entry Time</label>
                <p className="mt-1 text-sm text-slate-200">{tradeMeta.buyTime}</p>
              </div>

              <div>
                <label className="text-sm text-slate-400">Exit Time</label>
                <p className="mt-1 text-sm text-slate-200">{tradeMeta.sellTime}</p>
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
                      onClick={() => setSetup(strategy)}
                      className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                        setup === strategy
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
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g., scalp, intraday, options"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2 text-white placeholder-slate-500 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Market Condition
                </label>
                <select
                  value={marketCondition}
                  onChange={(e) => setMarketCondition(e.target.value)}
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
                  value={emotionalState}
                  onChange={(e) => setEmotionalState(e.target.value)}
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
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
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
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What was your reasoning for this trade?"
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2 text-white placeholder-slate-500 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Mistakes
                </label>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {MISTAKE_OPTIONS.map((item) => {
                    const selected = mistakes.includes(item);
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
                  value={lessons}
                  onChange={(e) => setLessons(e.target.value)}
                  placeholder="What did you learn from this trade?"
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2 text-white placeholder-slate-500 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
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
              onClick={handleSave}
              disabled={loading}
              className="flex-1 rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950 transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? isEditMode
                  ? "Updating..."
                  : "Saving..."
                : isEditMode
                ? "Update Trade"
                : "Save to Sanity"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}