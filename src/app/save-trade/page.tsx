"use client";

import { Suspense, useEffect, useState } from "react";
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

function SaveTradeFormInner() {
  const searchParams = useSearchParams();
  const formKey = searchParams.get("sanityId") || searchParams.toString();

  return <SaveTradeForm key={formKey} />;
}

function SaveTradeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sanityId = searchParams.get("sanityId") || "";
  const isEditMode = Boolean(sanityId);

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
    setError("");
    setSuccessMessage("");
    setTradeMeta(EMPTY_TRADE_META);
    setSetup("");
    setTags("");
    setNotes("");
    setMistakes([]);
    setLessons("");
    setEmotionalState("");
    setMarketCondition("");
    setOutcome("");
  };

  useEffect(() => {
    let cancelled = false;

    const loadTrade = async () => {
      resetForm();
      setPageLoading(true);

      if (!isEditMode) {
        const quantityParam = searchParams.get("quantity");
        const buyPriceParam = searchParams.get("buyPrice");
        const sellPriceParam = searchParams.get("sellPrice");
        const pnlParam = searchParams.get("totalPnl");

        if (cancelled) return;

        setTradeMeta({
          tradeId: searchParams.get("id") || "",
          symbol: searchParams.get("symbol") || "",
          direction: searchParams.get("direction") || "",
          quantity: quantityParam ? Number(quantityParam) : 0,
          buyPrice: buyPriceParam ? Number(buyPriceParam) : 0,
          sellPrice: sellPriceParam ? Number(sellPriceParam) : 0,
          buyTime: searchParams.get("buyTime") || "",
          sellTime: searchParams.get("sellTime") || "",
          totalPnl: pnlParam ? Number(pnlParam) : 0,
        });

        setPageLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/sanity/trade/${sanityId}?t=${Date.now()}`, {
          method: "GET",
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
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
  }, [sanityId, isEditMode, searchParams]);

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
      {/* keep your same JSX UI here */}
    </main>
  );
}

export default function SaveTradePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0a0f1f] text-white">
          Loading...
        </div>
      }
    >
      <SaveTradeFormInner />
    </Suspense>
  );
}