// src/lib/pnl.ts
import type { Trade } from "@/src/types/trade";
import {
  ESTIMATED_CHARGE_PER_TRADE,
  NIFTY_LOT_SIZE,
} from "@/src/lib/trading-config";

export function calculateGrossPnL(trades: Trade[]) {
  return trades.reduce((sum, trade) => sum + (trade.pnl ?? 0), 0);
}

export function calculateEstimatedCharges(trades: Trade[]) {
  return trades.length * ESTIMATED_CHARGE_PER_TRADE;
}

export function calculateEstimatedNetPnL(trades: Trade[]) {
  const grossPnL = calculateGrossPnL(trades);
  const estimatedCharges = calculateEstimatedCharges(trades);
  return grossPnL - estimatedCharges;
}

export function calculateNetPnLPoints(
  netPnL: number,
  lotSize: number = NIFTY_LOT_SIZE
) {
  if (!lotSize || lotSize <= 0) return 0;
  return netPnL / lotSize;
}

export function calculateEstimatedNetPnLPoints(
  trades: Trade[],
  lotSize: number = NIFTY_LOT_SIZE
) {
  const netPnL = calculateEstimatedNetPnL(trades);
  return calculateNetPnLPoints(netPnL, lotSize);
}