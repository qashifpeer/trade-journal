// src/lib/dashboard.ts
import type { Trade, DashboardStats, MistakeCount } from "@/src/types/trade";
import {
  calculateEstimatedNetPnL,
  calculateEstimatedNetPnLPoints,
} from "@/src/lib/pnl";
import {
  DEFAULT_RISK_AMOUNT,
  DEFAULT_REWARD_AMOUNT,
} from "@/src/lib/trading-config";

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

function titleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function normalizeLabel(value?: string | null) {
  if (!value || !value.trim()) return "Unknown";
  return value.trim();
}

function normalizeMistakes(mistakes?: string[] | string | null): string[] {
  if (!mistakes) return [];

  if (Array.isArray(mistakes)) {
    return mistakes
      .map((item) => item?.trim())
      .filter((item): item is string => Boolean(item));
  }

  if (typeof mistakes === "string") {
    return mistakes
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function groupTradesByField(
  trades: Trade[],
  getKey: (trade: Trade) => string | undefined | null
): GroupedStat[] {
  const grouped = new Map<string, Trade[]>();

  for (const trade of trades) {
    const key = normalizeLabel(getKey(trade));

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }

    grouped.get(key)!.push(trade);
  }

  return Array.from(grouped.entries())
    .map(([label, groupedTrades]) => {
      const totalPnL = groupedTrades.reduce(
        (sum, trade) => sum + (trade.pnl ?? 0),
        0
      );

      const tradesCount = groupedTrades.length;
      const wins = groupedTrades.filter((trade) => (trade.pnl ?? 0) > 0).length;

      return {
        label,
        trades: tradesCount,
        totalPnL,
        averagePnL: tradesCount > 0 ? totalPnL / tradesCount : 0,
        winRate: tradesCount > 0 ? (wins / tradesCount) * 100 : 0,
      };
    })
    .sort((a, b) => b.totalPnL - a.totalPnL);
}

function buildOutcomeBreakdown(trades: Trade[]): OutcomeBreakdownItem[] {
  const totalTrades = trades.length;
  const outcomeMap = new Map<string, number>();

  for (const trade of trades) {
    const label = normalizeLabel(trade.outcome);
    outcomeMap.set(label, (outcomeMap.get(label) || 0) + 1);
  }

  return Array.from(outcomeMap.entries())
    .map(([label, count]) => ({
      label,
      count,
      percentage: totalTrades > 0 ? (count / totalTrades) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

function calculateAverageRiskReward(trades: Trade[]) {
  if (trades.length === 0) return null;

  const ratios = trades.map((trade) => {
    const risk =
      trade.riskAmount && trade.riskAmount > 0
        ? trade.riskAmount
        : DEFAULT_RISK_AMOUNT;

    const reward =
      trade.rewardAmount && trade.rewardAmount > 0
        ? trade.rewardAmount
        : DEFAULT_REWARD_AMOUNT;

    if (!risk || risk <= 0) return 0;
    return reward / risk;
  });

  if (ratios.length === 0) return null;

  const total = ratios.reduce((sum, ratio) => sum + ratio, 0);
  return total / ratios.length;
}

export function calculateDashboardStats(
  trades: Trade[]
): AdvancedDashboardStats {
  const totalTrades = trades.length;

  const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl ?? 0), 0);

  const winningTrades = trades.filter((trade) => (trade.pnl ?? 0) > 0).length;

  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

  const estimatedNetPnL = calculateEstimatedNetPnL(trades);
  const estimatedNetPnLPoints = calculateEstimatedNetPnLPoints(trades);
  const averageRiskReward = calculateAverageRiskReward(trades);

  const mistakeMap: Record<string, number> = {};

  for (const trade of trades) {
    const parsedMistakes = normalizeMistakes(trade.mistakes);

    for (const mistake of parsedMistakes) {
      mistakeMap[mistake] = (mistakeMap[mistake] || 0) + 1;
    }
  }

  const mostCommonMistakes: MistakeCount[] = Object.entries(mistakeMap)
    .map(([mistake, count]) => ({
      mistake: titleCase(mistake),
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalPnL,
    totalTrades,
    averageRiskReward,
    winRate,
    mostCommonMistakes,
    estimatedNetPnL,
    estimatedNetPnLPoints,
    setupPerformance: groupTradesByField(trades, (trade) => trade.setup),
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