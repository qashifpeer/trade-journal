// src/lib/dashboard.ts
import type {
  Trade,
  DashboardStats,
  MistakeCount,
} from "@/src/types/trade";
import { calculateEstimatedNetPnL } from "@/src/lib/pnl";

export interface GroupedStat {
  label: string;
  trades: number;
  totalPnL: number;
  averagePnL: number;
  winRate: number;
}

export interface OutcomeBreakdownItem {
  label: string;
  count: number;
  percentage: number;
}

export interface AdvancedDashboardStats extends DashboardStats {
  setupPerformance: GroupedStat[];
  emotionalPerformance: GroupedStat[];
  marketConditionPerformance: GroupedStat[];
  outcomeBreakdown: OutcomeBreakdownItem[];
}

/**
 * Normalize mistakes into a lowercased array of non-empty strings.
 * Handles both old string form and new string[] form.
 */
function normalizeMistakes(
  mistakes?: string | string[] | null
): string[] {
  if (!mistakes) return [];

  const array = Array.isArray(mistakes)
    ? mistakes
    : mistakes.split(/\n|,/);

  return array
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0);
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function groupTradesByField(
  trades: Trade[],
  getValue: (trade: Trade) => string | undefined | null
): GroupedStat[] {
  const grouped: Record<string, Trade[]> = {};

  for (const trade of trades) {
    const raw = getValue(trade);
    const key =
      raw && raw.trim().length > 0 ? raw.trim() : "Not Set";

    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(trade);
  }

  return Object.entries(grouped)
    .map(([label, items]) => {
      const totalPnL = items.reduce(
        (sum, trade) => sum + (trade.pnl ?? 0),
        0
      );
      const tradesCount = items.length;
      const wins = items.filter(
        (trade) => (trade.pnl ?? 0) > 0
      ).length;

      return {
        label: titleCase(label),
        trades: tradesCount,
        totalPnL,
        averagePnL: tradesCount ? totalPnL / tradesCount : 0,
        winRate: tradesCount ? (wins / tradesCount) * 100 : 0,
      };
    })
    .sort((a, b) => b.totalPnL - a.totalPnL);
}

function buildOutcomeBreakdown(
  trades: Trade[]
): OutcomeBreakdownItem[] {
  const total = trades.length;
  const map: Record<string, number> = {};

  for (const trade of trades) {
    const raw = trade.outcome;
    const key =
      raw && raw.trim().length > 0 ? raw.trim() : "not set";
    map[key] = (map[key] || 0) + 1;
  }

  return Object.entries(map)
    .map(([label, count]) => ({
      label: titleCase(label),
      count,
      percentage: total ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export function calculateDashboardStats(
  trades: Trade[]
): AdvancedDashboardStats {
  const totalTrades = trades.length;

  const totalPnL = trades.reduce(
    (sum, trade) => sum + (trade.pnl ?? 0),
    0
  );

  const winningTrades = trades.filter(
    (trade) => (trade.pnl ?? 0) > 0
  ).length;

  const winRate =
    totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

  // Use your helper to derive estimated net P&L (per selected month/year trades)
  const estimatedNetPnL = calculateEstimatedNetPnL(trades);

  const mistakeMap: Record<string, number> = {};

  for (const trade of trades) {
    const parsedMistakes = normalizeMistakes(trade.mistakes);

    for (const mistake of parsedMistakes) {
      mistakeMap[mistake] = (mistakeMap[mistake] || 0) + 1;
    }
  }

  const mostCommonMistakes: MistakeCount[] = Object.entries(
    mistakeMap
  )
    .map(([mistake, count]) => ({
      mistake: titleCase(mistake),
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalPnL,
    totalTrades,
    averageRiskReward: null, // keep for later calculation
    winRate,
    mostCommonMistakes,
    estimatedNetPnL,
    setupPerformance: groupTradesByField(
      trades,
      (trade) => trade.setup
    ),
    emotionalPerformance: groupTradesByField(
      trades,
      (trade) => trade.emotionalState
    ),
    marketConditionPerformance: groupTradesByField(
      trades,
      (trade) => trade.marketCondition
    ),
    outcomeBreakdown: buildOutcomeBreakdown(trades),
  };
}