// src/lib/pnl.ts
import type { Trade } from "@/src/types/trade";

export function calculateEstimatedNetPnL(trades: Trade[]) {
  const grossPnL = trades.reduce((sum, trade) => sum + (trade.pnl ?? 0), 0);

  const totalTurnover = trades.reduce((sum, trade) => {
    const buyValue = (trade.entryPrice ?? 0) * (trade.quantity ?? 0);
    const sellValue = (trade.exitPrice ?? 0) * (trade.quantity ?? 0);
    return sum + buyValue + sellValue;
  }, 0);

  const estimatedCharges = totalTurnover * 0.001; // temporary rough estimate

  return grossPnL - estimatedCharges;
}