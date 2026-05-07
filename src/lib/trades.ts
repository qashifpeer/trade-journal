// src/lib/trades.ts
import { groq } from "next-sanity";
import type { Trade } from "@/src/types/trade";
import { getSanityClient } from "@/src/lib/sanity.client";

type RawTrade = {
  _id: string;
  tradeDate?: string | null;
  fyersTradeId?: string | null;
  symbol?: string | null;
  direction?: "Long" | "Short" | null;
  quantity?: number | null;
  qty?: number | null;
  buyPrice?: number | null;
  sellPrice?: number | null;
  buyTime?: string | null;
  sellTime?: string | null;
  entryTime?: string | null;
  exitTime?: string | null;
  pnl?: number | null;
  setup?: string | null;
  outcome?: string | null;
  mistakes?: string[] | string | null;
  notes?: string | null;
  emotionalState?: string | null;
  marketCondition?: string | null;
  riskAmount?: number | null;
  rewardAmount?: number | null;
};

const tradesByMonthYearQuery = groq`
  *[
    _type == "trade" &&
    defined(tradeDate) &&
    dateTime(tradeDate) >= dateTime($startDate) &&
    dateTime(tradeDate) < dateTime($endDate)
  ] | order(tradeDate desc) {
    _id,
    tradeDate,
    fyersTradeId,
    symbol,
    direction,
    quantity,
    qty,
    buyPrice,
    sellPrice,
    buyTime,
    sellTime,
    entryTime,
    exitTime,
    pnl,
    setup,
    outcome,
    mistakes,
    notes,
    emotionalState,
    marketCondition,
    riskAmount,
    rewardAmount
  }
`;

function normalizeTrade(raw: RawTrade): Trade {
  return {
    _id: raw._id,
    tradeDate: raw.tradeDate ?? "",
    fyersTradeId: raw.fyersTradeId ?? undefined,
    symbol: raw.symbol ?? "—",
    direction: raw.direction === "Short" ? "Short" : "Long",
    quantity: raw.quantity ?? raw.qty ?? 0,
    buyPrice: raw.buyPrice ?? null,
    sellPrice: raw.sellPrice ?? null,
    buyTime: raw.buyTime ?? null,
    sellTime: raw.sellTime ?? null,
    entryTime: raw.entryTime ?? null,
    exitTime: raw.exitTime ?? null,
    pnl: raw.pnl ?? 0,
    setup: raw.setup ?? null,
    outcome: raw.outcome ?? null,
    mistakes: raw.mistakes ?? null,
    notes: raw.notes ?? null,
    emotionalState: raw.emotionalState ?? null,
    marketCondition: raw.marketCondition ?? null,
    riskAmount: raw.riskAmount ?? null,
    rewardAmount: raw.rewardAmount ?? null,
  };
}

function getMonthRange(year: number, month: number) {
  const safeMonth = Math.min(Math.max(month, 1), 12);

  const start = new Date(Date.UTC(year, safeMonth - 1, 1));
  const end = new Date(Date.UTC(year, safeMonth, 1));

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

export async function getTradesByMonthYear(
  year: number,
  month: number
): Promise<Trade[]> {
  const client = getSanityClient();
  const { startDate, endDate } = getMonthRange(year, month);

  const rawTrades = await client.fetch<RawTrade[]>(
    tradesByMonthYearQuery,
    { startDate, endDate },
    { next: { revalidate: 0 } }
  );

  return rawTrades.map(normalizeTrade);
}