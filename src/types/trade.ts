// src/types/trade.ts
export type Direction = "Long" | "Short";

export type Outcome =
  | "mistake"
  | "followed plan"
  | "full success"
  | "partial success";

export interface Trade {
  _id: string;
  tradeDate: string;
  fyersTradeId: string;
  symbol: string;
  direction: Direction;
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  entryTime: string;
  exitTime: string;
  pnl: number;
  setup?: string;
  outcome?: Outcome;
  tags?: string[];
  marketCondition?: string;
  emotionalState?: string;
  notes?: string;
  mistakes?: string;
  lessons?: string;
  createdAt: string;
 estimatedNetPnL: number;
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
}
