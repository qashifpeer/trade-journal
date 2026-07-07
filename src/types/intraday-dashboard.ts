export type DashboardPeriodType = "weekly" | "monthly" | "quarterly" | "yearly";

export type DashboardSummary = {
  totalTrades: number;
  tradingDays: number;
  grossPnl: number;
  totalCharges: number;
  netPnl: number;
  avgTradesPerDay: number;
  avgNetPnlPerDay: number;
  greenDays: number;
  redDays: number;
  flatDays: number;
  bestDay: {
    date: string;
    netPnl: number;
  } | null;
  worstDay: {
    date: string;
    netPnl: number;
  } | null;
};

export type DashboardTrendPoint = {
  label: string;
  date: string;
  grossPnl: number;
  charges: number;
  netPnl: number;
  trades: number;
  cumulativeNetPnl: number;
};

export type DashboardTagInsight = {
  tag: string;
  count: number;
  totalNetPnl: number;
  greenDays: number;
  redDays: number;
};

export type DashboardDayRow = {
  _id: string;
  date: string;
  numberOfTrades: number;
  outcome: number;
  charges: number;
  netPnl: number;
  tags: string[];
};

export type IntradayDashboardData = {
  periodType: DashboardPeriodType;
  periodLabel: string;
  summary: DashboardSummary;
  trend: DashboardTrendPoint[];
  topPositiveTags: DashboardTagInsight[];
  topNegativeTags: DashboardTagInsight[];
  mostUsedTags: DashboardTagInsight[];
  days: DashboardDayRow[];
};