// src/types/api.ts
export type SaveTradePayload = {
  fyersTradeId: string;
  symbol: string;
  direction: "Long" | "Short" | string;
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  entryTime: string;
  exitTime: string;
  pnl: number;
  setup?: string;
  tags?: string[];
  notes?: string;
  mistakes?: string[]; // array from checkboxes
  lessons?: string;
  emotionalState?: string;
  marketCondition?: string;
  outcome?: "mistake" | "followed plan" | "full success" | "partial success" | "";
  tradeDate: string; // YYYY-MM-DD from parseFyersDateToISO
  date?: string; // duplicate field you send, we can normalize
  createdAt?: string;
};