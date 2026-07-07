import {
  DashboardDayRow,
  DashboardPeriodType,
  DashboardTagInsight,
  DashboardTrendPoint,
  IntradayDashboardData,
} from "@/src/types/intraday-dashboard";

type RawIntradayTrade = {
  _id: string;
  date: string;
  numberOfTrades?: number | null;
  outcome?: number | null;
  charges?: number | null;
  netPnl?: number | null;
  tags?: Array<
    | string
    | {
        title?: string | null;
        value?: string | null;
      }
  > | null;
};

function formatDateLabel(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(new Date(date));
}

function formatMonthLabel(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "2-digit",
  }).format(new Date(date));
}

function getQuarter(date: Date) {
  return Math.floor(date.getMonth() / 3) + 1;
}

function normalizeTags(tags: RawIntradayTrade["tags"]): string[] {
  if (!tags || !Array.isArray(tags)) return [];

  return tags
    .map((tag) => {
      if (typeof tag === "string") return tag.trim();
      return (tag?.title || tag?.value || "").trim();
    })
    .filter(Boolean);
}

function normalizeDays(trades: RawIntradayTrade[]): DashboardDayRow[] {
  return trades
    .map((trade) => ({
      _id: trade._id,
      date: trade.date,
      numberOfTrades: Number(trade.numberOfTrades || 0),
      outcome: Number(trade.outcome || 0),
      charges: Number(trade.charges || 0),
      netPnl: Number(
        trade.netPnl ?? Number(trade.outcome || 0) - Math.abs(Number(trade.charges || 0)),
      ),
      tags: normalizeTags(trade.tags),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function buildSummary(days: DashboardDayRow[]) {
  const totalTrades = days.reduce((sum, day) => sum + day.numberOfTrades, 0);
  const tradingDays = days.length;
  const grossPnl = days.reduce((sum, day) => sum + day.outcome, 0);
  const totalCharges = days.reduce((sum, day) => sum + day.charges, 0);
  const netPnl = days.reduce((sum, day) => sum + day.netPnl, 0);
  const greenDays = days.filter((day) => day.netPnl > 0).length;
  const redDays = days.filter((day) => day.netPnl < 0).length;
  const flatDays = days.filter((day) => day.netPnl === 0).length;

  const best = days.reduce<DashboardDayRow | null>(
    (acc, day) => (!acc || day.netPnl > acc.netPnl ? day : acc),
    null,
  );

  const worst = days.reduce<DashboardDayRow | null>(
    (acc, day) => (!acc || day.netPnl < acc.netPnl ? day : acc),
    null,
  );

  return {
    totalTrades,
    tradingDays,
    grossPnl,
    totalCharges,
    netPnl,
    avgTradesPerDay: tradingDays ? totalTrades / tradingDays : 0,
    avgNetPnlPerDay: tradingDays ? netPnl / tradingDays : 0,
    greenDays,
    redDays,
    flatDays,
    bestDay: best
      ? {
          date: best.date,
          netPnl: best.netPnl,
        }
      : null,
    worstDay: worst
      ? {
          date: worst.date,
          netPnl: worst.netPnl,
        }
      : null,
  };
}

function buildTrend(days: DashboardDayRow[], periodType: DashboardPeriodType): DashboardTrendPoint[] {
  let cumulativeNetPnl = 0;

  if (periodType === "weekly" || periodType === "monthly") {
    return days.map((day) => {
      cumulativeNetPnl += day.netPnl;

      return {
        label: formatDateLabel(day.date),
        date: day.date,
        grossPnl: day.outcome,
        charges: day.charges,
        netPnl: day.netPnl,
        trades: day.numberOfTrades,
        cumulativeNetPnl,
      };
    });
  }

  const grouped = new Map<
    string,
    {
      label: string;
      date: string;
      grossPnl: number;
      charges: number;
      netPnl: number;
      trades: number;
    }
  >();

  for (const day of days) {
    const currentDate = new Date(day.date);
    const key =
      periodType === "quarterly"
        ? `${currentDate.getFullYear()}-${currentDate.getMonth()}`
        : `${currentDate.getFullYear()}-Q${getQuarter(currentDate)}`;

    const label =
      periodType === "quarterly"
        ? formatMonthLabel(day.date)
        : `Q${getQuarter(currentDate)} ${currentDate.getFullYear()}`;

    const existing = grouped.get(key) || {
      label,
      date: day.date,
      grossPnl: 0,
      charges: 0,
      netPnl: 0,
      trades: 0,
    };

    existing.grossPnl += day.outcome;
    existing.charges += day.charges;
    existing.netPnl += day.netPnl;
    existing.trades += day.numberOfTrades;

    grouped.set(key, existing);
  }

  return Array.from(grouped.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, item]) => {
      cumulativeNetPnl += item.netPnl;

      return {
        label: item.label,
        date: item.date,
        grossPnl: item.grossPnl,
        charges: item.charges,
        netPnl: item.netPnl,
        trades: item.trades,
        cumulativeNetPnl,
      };
    });
}

function buildTagInsights(days: DashboardDayRow[]) {
  const map = new Map<string, DashboardTagInsight>();

  for (const day of days) {
    for (const tag of day.tags) {
      const normalized = tag.trim();
      if (!normalized) continue;

      const current = map.get(normalized) || {
        tag: normalized,
        count: 0,
        totalNetPnl: 0,
        greenDays: 0,
        redDays: 0,
      };

      current.count += 1;
      current.totalNetPnl += day.netPnl;

      if (day.netPnl > 0) current.greenDays += 1;
      if (day.netPnl < 0) current.redDays += 1;

      map.set(normalized, current);
    }
  }

  const all = Array.from(map.values());

  return {
    topPositiveTags: [...all].sort((a, b) => b.totalNetPnl - a.totalNetPnl).slice(0, 5),
    topNegativeTags: [...all].sort((a, b) => a.totalNetPnl - b.totalNetPnl).slice(0, 5),
    mostUsedTags: [...all].sort((a, b) => b.count - a.count).slice(0, 8),
  };
}

export function buildPeriodLabel(periodType: DashboardPeriodType, value: string) {
  if (periodType === "weekly") return `Week of ${value}`;
  if (periodType === "monthly") return value;
  if (periodType === "quarterly") return value;
  return value;
}

export function buildIntradayDashboardData(params: {
  trades: RawIntradayTrade[];
  periodType: DashboardPeriodType;
  periodLabel: string;
}): IntradayDashboardData {
  const days = normalizeDays(params.trades);
  const summary = buildSummary(days);
  const trend = buildTrend(days, params.periodType);
  const tags = buildTagInsights(days);

  return {
    periodType: params.periodType,
    periodLabel: params.periodLabel,
    summary,
    trend,
    topPositiveTags: tags.topPositiveTags,
    topNegativeTags: tags.topNegativeTags,
    mostUsedTags: tags.mostUsedTags,
    days: [...days].sort((a, b) => b.date.localeCompare(a.date)),
  };
}