// src/types/trade.ts
export type TradeDirection = "Long" | "Short";

export type TradeOutcome =
  | "mistake"
  | "followed plan"
  | "full success"
  | "partial success"
  | string;

export interface Trade {
  _id: string;
  tradeDate: string;

  fyersTradeId?: string;
  symbol: string;
  direction: TradeDirection;
  quantity: number;

  buyPrice?: number | null;
  sellPrice?: number | null;

  buyTime?: string | null;
  sellTime?: string | null;

  entryTime?: string | null;
  exitTime?: string | null;

  pnl: number;

  setup?: string | null;
  outcome?: TradeOutcome | null;

  mistakes?: string[] | string | null;

  notes?: string | null;
  emotionalState?: string | null;
  marketCondition?: string | null;

  riskAmount?: number | null;
  rewardAmount?: number | null;
}

export interface MistakeCount {
  mistake: string;
  count: number;
}

export interface DashboardStats {
  totalPnL: number;
  totalTrades: number;
  averageRiskReward: number | null;
  winRate: number;
  mostCommonMistakes: MistakeCount[];
  estimatedNetPnL: number;
  estimatedNetPnLPoints: number;
}