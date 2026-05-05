// src/lib/pnl.ts
import type { Trade } from "@/src/types/trade";

const ESTIMATED_CHARGE_PER_TRADE = 100; // ₹100 per trade

export function calculateEstimatedNetPnL(trades: Trade[]) {
  // Gross P&L from your stored pnl field
  const grossPnL = trades.reduce(
    (sum, trade) => sum + (trade.pnl ?? 0),
    0
  );

  // Fixed charges: 100 INR per trade
  const estimatedCharges =
    trades.length * ESTIMATED_CHARGE_PER_TRADE;

  // Net = gross - fixed charges
  return grossPnL - estimatedCharges;
}