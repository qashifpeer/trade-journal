// src/app/save-trade/page.tsx
"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
  "Inside Bar",
  "Breakout",
  "SL Hunt",
  "FIB Retracement",
  "Reversal",
  "Pullback",
  "News Based",
  "Trend",
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
function SaveTradeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sanityId = searchParams.get("sanityId") || "";
  const isEditMode = Boolean(sanityId);

  const initialFromQuery = useMemo(() => {
    const quantityParam = searchParams.get("quantity");
    const buyPriceParam = searchParams.get("buyPrice");
    const sellPriceParam = searchParams.get("sellPrice");
    const pnlParam = searchParams.get("totalPnl");

    return {
      tradeId: searchParams.get("id") || "",
      symbol: searchParams.get("symbol") || "",
      direction: searchParams.get("direction") || "",
      quantity: quantityParam ? Number(quantityParam) : 0,
      buyPrice: buyPriceParam ? Number(buyPriceParam) : 0,
      sellPrice: sellPriceParam ? Number(sellPriceParam) : 0,
      buyTime: searchParams.get("buyTime") || "",
      sellTime: searchParams.get("sellTime") || "",
      totalPnl: pnlParam ? Number(pnlParam) : 0,
    };
  }, [searchParams]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tradeMeta, setTradeMeta] = useState(initialFromQuery);
  const [pageLoading, setPageLoading] = useState(isEditMode);

  // Additional fields
  const [setup, setSetup] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [lessons, setLessons] = useState("");
  const [emotionalState, setEmotionalState] = useState("");
  const [marketCondition, setMarketCondition] = useState("");
  const [outcome, setOutcome] = useState("");

  useEffect(() => {
    if (!isEditMode) {
      setTradeMeta(initialFromQuery);
      setPageLoading(false);
      return;
    }

    const loadTrade = async () => {
      try {
        setPageLoading(true);
        setError("");

        const res = await fetch(`/api/sanity/trade/${sanityId}`, {
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load trade");
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
        setError(err instanceof Error ? err.message : "Failed to load trade");
      } finally {
        setPageLoading(false);
      }
    };
    loadTrade();
  }, [initialFromQuery, isEditMode, sanityId]);

  const toggleMistake = (value: string) => {
    setMistakes((prev) =>
      prev.includes(value) ? prev.filter((m) => m !== value) : [...prev, value],
    );
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");

    try {
      const tradeDate = parseFyersDateToISO(tradeMeta.buyTime);

      const tradeData = {
        // FYERS data
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

        // Additional fields
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
        // Metadata
        createdAt: isEditMode ? undefined : new Date().toISOString(),
      };

      const res = await fetch("/api/sanity/save-trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tradeData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save trade");
        return;
      }
      const targetTradeId = data.tradeId || sanityId;

      // Redirect back to trade-details
      router.push(
        targetTradeId ? `/trade-details/${targetTradeId}` : "/trade-details",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save trade");
    } finally {
      setLoading(false);
    }
  };
  if (pageLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center text-white">
        Loading trade...
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 text-white md:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {isEditMode ? "Edit Trade Journal" : "Save Trade to Journal"}
        </h1>
        <h1 className="text-3xl font-bold">
          {isEditMode ? "Edit Trade Journal" : "Save Trade to Journal"}
        </h1>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* FYERS Data Section */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold">FYERS Trade Data</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-slate-400">Symbol</label>
              <p className="mt-1 break-all font-mono text-lg">
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
              <p className="mt-1 font-mono text-lg">{tradeMeta.quantity}</p>
            </div>

            <div>
              <label className="text-sm text-slate-400">Entry Price</label>
              <p className="mt-1 font-mono text-lg">
                ₹{tradeMeta.buyPrice.toFixed(2)}
              </p>
            </div>

            <div>
              <label className="text-sm text-slate-400">Exit Price</label>
              <p className="mt-1 font-mono text-lg">
                ₹{tradeMeta.sellPrice.toFixed(2)}
              </p>
            </div>

            <div>
              <label className="text-sm text-slate-400">P&L</label>
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
              <p className="mt-1 text-sm">{tradeMeta.buyTime}</p>
            </div>

            <div>
              <label className="text-sm text-slate-400">Exit Time</label>
              <p className="mt-1 text-sm">{tradeMeta.sellTime}</p>
            </div>
          </div>
        </div>

        {/* Additional Details Section */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold">Additional Details</h2>

          <div className="space-y-4">
            {/* Strategy Selection - Button Grid */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Setup/Strategy
              </label>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {STRATEGY_OPTIONS.map((strategy) => (
                  <button
                    key={strategy}
                    type="button"
                    onClick={() => setSetup(strategy)}
                    className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                      setup === strategy
                        ? "bg-blue-500 text-white ring-2 ring-blue-400"
                        : "bg-slate-700 text-slate-300 hover:bg-blue-500/80 hover:text-white"
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
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
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
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
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
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                        selected
                          ? "bg-red-500/90 text-white ring-2 ring-red-400"
                          : "bg-slate-700 text-slate-300 hover:bg-red-500/70 hover:text-white"
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
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold transition-colors hover:bg-white/10"
          >
            Cancel
          </button>

          <button
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
    </main>
  );
}

export default function SaveTradePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-white">
          Loading...
        </div>
      }
    >
      <SaveTradeForm />
    </Suspense>
  );
}
