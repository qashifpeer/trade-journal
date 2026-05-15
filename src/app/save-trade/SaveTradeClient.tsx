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
    [params]
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

  const resetForm = () => {
    setTradeMeta(EMPTY_TRADE_META);
    setSetup("");
    setTags("");
    setNotes("");
    setMistakes([]);
    setLessons("");
    setEmotionalState("");
    setMarketCondition("");
    setOutcome("");
    setError("");
    setSuccessMessage("");
  };

  useEffect(() => {
    let cancelled = false;

    const loadTrade = async () => {
      resetForm();
      setPageLoading(true);

      if (!isEditMode) {
        if (!cancelled) {
          setTradeMeta(initialFromQuery);
          setPageLoading(false);
        }
        return;
      }

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
    };

    loadTrade();

    return () => {
      cancelled = true;
    };
  }, [initialFromQuery, isEditMode, sanityId]);

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
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
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

        {/* keep the rest of your form JSX exactly same */}
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
    </main>
  );
}