// src/lib/trades.ts
import { client } from "@/src//sanity/lib/client";
import { tradesByMonthYearQuery } from "@/src/sanity/lib/queries";
import { getMonthDateRange } from "./date";
import type { Trade } from "@/src/types/trade";

export async function getTradesByMonthYear(
  year: number,
  month: number
): Promise<Trade[]> {
  const { startDate, endDate } = getMonthDateRange(year, month);

  return client.fetch(tradesByMonthYearQuery, {
    startDate,
    endDate,
  });
}