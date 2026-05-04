// src/app/trade-details/[id]/page.tsx
import Link from "next/link";
import { getSanityWriteClient } from "@/src/lib/sanity.client";

type TradeDoc = {
  _id: string;
  fyersTradeId: string;
  symbol: string;
  direction: "Long" | "Short";
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
  updatedAt?: string;
};

async function getTrade(id: string): Promise<TradeDoc | null> {
  const client = getSanityWriteClient();

  const trade = await client.fetch(
    `*[_type == "trade" && _id == $id][0]{
      _id,
      fyersTradeId,
      symbol,
      direction,
      quantity,
      entryPrice,
      exitPrice,
      entryTime,
      exitTime,
      pnl,
      tradeDate,
      setup,
      outcome,
      tags,
      marketCondition,
      emotionalState,
      notes,
      mistakes,
      lessons,
      createdAt,
      updatedAt
    }`,
    { id }
  );

  return trade ?? null;
}

export default async function TradeDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trade = await getTrade(id);

  if (!trade) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 text-white md:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Trade Details</h1>
        </div>

        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          Trade not found. It may have been deleted or the ID is invalid.
        </div>

        <div className="mt-6">
          <Link
            href="/trade-details"
            className="inline-flex rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-white/10"
          >
            ← Back to trades
          </Link>
        </div>
      </main>
    );
  }

  const formatPrice = (value: number) => `₹${value.toFixed(2)}`;
  const formatPnl = (value: number) =>
    `${value >= 0 ? "+" : "-"}₹${Math.abs(value).toFixed(2)}`;
  const pnlColor = trade.pnl >= 0 ? "text-emerald-400" : "text-red-400";

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 text-white md:px-6">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trade Details</h1>
          <p className="mt-2 text-slate-300">
            Saved journal entry for{" "}
            <span className="font-semibold text-white">{trade.symbol}</span>.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/trade-details"
            className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-white/10"
          >
            ← Back
          </Link>

          <Link
            href={`/save-trade?sanityId=${trade._id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-600"
          >
            ✏️ Edit
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {/* Core trade info */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold">Core Trade</h2>

          <div className="grid gap-4 md:grid-cols-2">
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
                FYERS Trade ID
              </p>
              <p className="mt-1 font-mono text-sm">{trade.fyersTradeId}</p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Trade Date
              </p>
              <p className="mt-1 text-sm text-slate-200">{trade.tradeDate}</p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Quantity
              </p>
              <p className="mt-1 font-mono">{trade.quantity}</p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Entry Price
              </p>
              <p className="mt-1 font-mono">{formatPrice(trade.entryPrice)}</p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Exit Price
              </p>
              <p className="mt-1 font-mono">{formatPrice(trade.exitPrice)}</p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Total P&amp;L
              </p>
              <p className={`mt-1 font-mono font-semibold ${pnlColor}`}>
                {formatPnl(trade.pnl)}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Entry Time
              </p>
              <p className="mt-1 text-sm text-slate-300">{trade.entryTime}</p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Exit Time
              </p>
              <p className="mt-1 text-sm text-slate-300">{trade.exitTime}</p>
            </div>
          </div>
        </div>

        {/* Journal details */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold">Journal Details</h2>

          <div className="space-y-4 text-slate-200">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Setup / Strategy
                </p>
                <p className="mt-1">{trade.setup || "-"}</p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Market Condition
                </p>
                <p className="mt-1">{trade.marketCondition || "-"}</p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Emotional State
                </p>
                <p className="mt-1">{trade.emotionalState || "-"}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Outcome
              </p>
              <p className="mt-1">{trade.outcome || "-"}</p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Tags
              </p>
              {trade.tags && trade.tags.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-2">
                  {trade.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-1">-</p>
              )}
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Mistakes
              </p>
              {trade.mistakes && trade.mistakes.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-2">
                  {trade.mistakes.map((m) => (
                    <span
                      key={m}
                      className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs text-red-400"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-1">-</p>
              )}
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Notes
              </p>
              <p className="mt-1 whitespace-pre-wrap">
                {trade.notes || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Lessons Learned
              </p>
              <p className="mt-1 whitespace-pre-wrap">
                {trade.lessons || "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Metadata */}
        {(trade.createdAt || trade.updatedAt) && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-500">
            <p>
              Created:{" "}
              {trade.createdAt
                ? new Date(trade.createdAt).toLocaleString("en-IN")
                : "-"}
            </p>
            <p className="mt-1">
              Last updated:{" "}
              {trade.updatedAt
                ? new Date(trade.updatedAt).toLocaleString("en-IN")
                : "-"}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}