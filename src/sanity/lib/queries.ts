// src/sanity/lib/queries.ts
import { groq } from "next-sanity";

export const tradesByMonthYearQuery = groq`
  *[
    _type == "trade" &&
    tradeDate >= $startDate &&
    tradeDate < $endDate
  ] | order(tradeDate desc) {
    _id,
    tradeDate,
    fyersTradeId,
    symbol,
    direction,
    quantity,
    entryPrice,
    exitPrice,
    entryTime,
    exitTime,
    pnl,
    setup,
    outcome,
    tags,
    marketCondition,
    emotionalState,
    notes,
    mistakes,
    lessons,
    createdAt
  }
`;