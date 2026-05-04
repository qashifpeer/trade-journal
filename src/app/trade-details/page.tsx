// src/app/trade-details/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type MergedTrade = {
  id: string;
  symbol: string;
  direction: "Long" | "Short";
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  buyTime: string;
  sellTime: string;
  totalPnl: number;
};

type TradesApiResponse = {
  success?: boolean;
  count?: number;
  trades?: MergedTrade[];
  error?: string;
  debug?: unknown;
};

type SanityStatusResponse = {
  success: boolean;
  trades: {
    fyersTradeId: string;
    sanityId: string;
  }[];
};

export default function TradeDetailsPage() {
  const router = useRouter();
  const [trades, setTrades] = useState<MergedTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sanityMap, setSanityMap] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    const loadTradesAndStatus = async () => {
      try {
        setLoading(true);
        setError("");

        // ── Step 1: FYERS fetch ──────────────────────────────────────────
        console.log("[1] Fetching FYERS trades...");

        const res = await fetch("/api/fyers/trades", {
          credentials: "include",
          cache: "no-store",
          headers: { "Cache-Control": "no-store" },
        });

        console.log("[2] FYERS response status:", res.status);

        const data: TradesApiResponse = await res.json();

        console.log("[3] FYERS response body:", data);

        if (cancelled) {
          console.log("[!] Cancelled after FYERS fetch");
          return;
        }

        if (!res.ok || !data.success) {
          console.error("[!] FYERS fetch failed:", data);
          setError(data.error || "Failed to load FYERS trades");
          return;
        }

        const fyersTrades = Array.isArray(data.trades) ? data.trades : [];
        setTrades(fyersTrades);

        console.log("[4] FYERS trade count:", fyersTrades.length);
        console.log("[4] FYERS trade ids:", fyersTrades.map((t) => t.id));

        if (fyersTrades.length === 0) {
          console.log("[!] No FYERS trades, skipping Sanity status check");
          setSanityMap({});
          return;
        }

        // ── Step 2: Sanity status fetch ──────────────────────────────────
        const ids = fyersTrades.map((t) => t.id);

        console.log("[5] Fetching Sanity status for ids:", ids);

        const statusRes = await fetch("/api/sanity/trades/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fyersTradeIds: ids }),
        });

        console.log("[6] Sanity status response status:", statusRes.status);

        const statusData: SanityStatusResponse = await statusRes.json();

        console.log("[7] Sanity status response body:", statusData);

        if (!statusRes.ok || !statusData.success) {
          console.error("[!] Sanity status fetch failed:", statusData);
          return;
        }

        // ── Step 3: Build the map ────────────────────────────────────────
        const map: Record<string, string> = {};
        for (const item of statusData.trades) {
          if (item.fyersTradeId && item.sanityId) {
            map[item.fyersTradeId] = item.sanityId;
          }
        }

        console.log("[8] Sanity map built:", map);
        console.log(
          "[8] Saved trade ids in map:",
          Object.keys(map).length,
          "entries"
        );

        setSanityMap(map);
      } catch (err) {
        console.error("[!] Caught error in loadTradesAndStatus:", err);
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to fetch FYERS trades"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadTradesAndStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveTrade = (trade: MergedTrade) => {
    const params = new URLSearchParams({
      id: trade.id,
      symbol: trade.symbol,
      direction: trade.direction,
      quantity: trade.quantity.toString(),
      buyPrice: trade.buyPrice.toString(),
      sellPrice: trade.sellPrice.toString(),
      buyTime: trade.buyTime,
      sellTime: trade.sellTime,
      totalPnl: trade.totalPnl.toString(),
    });
    router.push(`/save-trade?${params.toString()}`);
  };

  const handleViewDetails = (sanityId: string) => {
    router.push(`/trade-details/${sanityId}`);
  };

  const formatPrice = (value: number) => `₹${value.toFixed(2)}`;
  const formatPnl = (value: number) =>
    `${value >= 0 ? "+" : "-"}₹${Math.abs(value).toFixed(2)}`;
  const pnlColor = (value: number) =>
    value >= 0 ? "text-emerald-400" : "text-red-400";

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 text-white md:px-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trade Details</h1>
          <p className="mt-2 text-slate-300">
            Merged FYERS executed orders into complete journal-ready trades.
          </p>
        </div>

        <a
          href="/api/fyers/login"
          className="inline-flex rounded-2xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-600"
        >
          Connect FYERS
        </a>
      </div>

      {loading && (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-blue-300">
          Loading trades...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && trades.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-300">
          No complete trades found for this account right now.
        </div>
      )}

      {!loading && !error && trades.length > 0 && (
        <div className="mb-4 text-sm text-slate-400">
          Showing {trades.length} complete trade
          {trades.length === 1 ? "" : "s"}.
        </div>
      )}

      <div className="grid gap-4">
        {trades.map((trade) => {
          const sanityId = sanityMap[trade.id];
          const isSaved = Boolean(sanityId);

          return (
            <div
              key={trade.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-white/20"
            >
              <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-8">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Symbol
                  </p>
                  <p className="mt-1 break-all font-semibold">{trade.symbol}</p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Direction
                  </p>
                  <p
                    className={`mt-1 font-semibold ${
                      trade.direction === "Long"
                        ? "text-emerald-400"
                        : "text-orange-400"
                    }`}
                  >
                    {trade.direction}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Quantity
                  </p>
                  <p className="mt-1 font-mono">{trade.quantity}</p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Buy Price
                  </p>
                  <p className="mt-1 font-mono">{formatPrice(trade.buyPrice)}</p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Sell Price
                  </p>
                  <p className="mt-1 font-mono">
                    {formatPrice(trade.sellPrice)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Buy Time
                  </p>
                  <p className="mt-1 text-sm text-slate-300">{trade.buyTime}</p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Sell Time
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    {trade.sellTime}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Total P&amp;L
                  </p>
                  <p
                    className={`mt-1 font-mono font-semibold ${pnlColor(
                      trade.totalPnl
                    )}`}
                  >
                    {formatPnl(trade.totalPnl)}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {isSaved ? (
                  <>
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                      Saved in Journal
                    </span>

                    <button
                      onClick={() => handleViewDetails(sanityId)}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-50 transition-colors hover:bg-white/10"
                    >
                      View details
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleSaveTrade(trade)}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-600"
                  >
                    Save Trade
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}