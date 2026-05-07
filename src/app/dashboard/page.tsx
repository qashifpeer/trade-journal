// src/app/dashboard/page.tsx
import { DashboardFilters } from "@/src/components/dashboard/dashboard-filters";
import { GroupPerformanceCard } from "@/src/components/dashboard/group-performance-card";
import { MistakesCard } from "@/src/components/dashboard/mistakes-card";
import { OutcomeBreakdownCard } from "@/src/components/dashboard/outcome-breakdown-card";
import { StatCard } from "@/src/components/dashboard/stat-card";
import { TradesTable } from "@/src/components/dashboard/trades-table";
import { calculateDashboardStats } from "@/src/lib/dashboard";
import { getDefaultMonthYear } from "@/src/lib/date";
import { formatInr } from "@/src/lib/format";
import {
  calculateEstimatedNetPnL,
  calculateNetPnLPoints,
} from "@/src/lib/pnl";
import { getTradesByMonthYear } from "@/src/lib/trades";
import {
  CandlestickChart,
  IndianRupee,
  Target,
  Trophy,
  Wallet,
} from "lucide-react";

type PageProps = {
  searchParams?: Promise<{
    month?: string;
    year?: string;
  }>;
};

function getPnLAppearance(value: number) {
  if (value < 0) {
    return {
      accent: "red" as const,
      valueClassName: "text-rose-400",
    };
  }

  if (value > 0) {
    return {
      accent: "green" as const,
      valueClassName: "text-emerald-400",
    };
  }

  return {
    accent: "cyan" as const,
    valueClassName: "text-slate-200",
  };
}

function isSameDate(tradeDate?: string, target?: Date) {
  if (!tradeDate || !target) return false;

  const date = new Date(tradeDate);
  if (Number.isNaN(date.getTime())) return false;

  return (
    date.getFullYear() === target.getFullYear() &&
    date.getMonth() === target.getMonth() &&
    date.getDate() === target.getDate()
  );
}

function formatPoints(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)} pts`;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const defaults = getDefaultMonthYear();

  const month = Number(params.month || defaults.month);
  const year = Number(params.year || defaults.year);

  const trades = await getTradesByMonthYear(year, month);
  const stats = calculateDashboardStats(trades);

  const grossAppearance = getPnLAppearance(stats.totalPnL);
  const netAppearance = getPnLAppearance(stats.estimatedNetPnL);
  const monthPointsAppearance = getPnLAppearance(stats.estimatedNetPnLPoints);

  const today = new Date();

  const todayTrades = trades.filter((trade) => isSameDate(trade.tradeDate, today));

  const todayEstimatedNetPnL = calculateEstimatedNetPnL(todayTrades);
  const todayEstimatedNetPnLPoints = calculateNetPnLPoints(todayEstimatedNetPnL);

  const todayPointsAppearance = getPnLAppearance(todayEstimatedNetPnLPoints);

  return (
    <main className="min-h-screen bg-[#0a0f1f] bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.10),_transparent_30%),radial-gradient(circle_at_right,_rgba(168,85,247,0.10),_transparent_25%),linear-gradient(180deg,_#0a0f1f_0%,_#0b1120_100%)] px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-[0_0_60px_rgba(34,211,238,0.08)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.22em] text-cyan-300/80">
                Trade Analytics
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-white">
                Dashboard Overview
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                Review your monthly performance, psychology, and recurring habits.
              </p>
            </div>

            <DashboardFilters month={month} year={year} />
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
          <StatCard
            title="Profit / Loss"
            value={formatInr(stats.totalPnL)}
            icon={Wallet}
            accent={grossAppearance.accent}
            valueClassName={grossAppearance.valueClassName}
          />

          <StatCard
            title="Net P&L (Estimated)"
            value={formatInr(stats.estimatedNetPnL)}
            hint="For selected month • After estimated charges"
            icon={IndianRupee}
            accent={netAppearance.accent}
            valueClassName={netAppearance.valueClassName}
          />

          <StatCard
            title="Today Net P&L Points"
            value={formatPoints(todayEstimatedNetPnLPoints)}
            hint="Today's estimated net P&L / lot size"
            icon={Target}
            accent={todayPointsAppearance.accent}
            valueClassName={todayPointsAppearance.valueClassName}
          />

          <StatCard
            title="Month Net P&L Points"
            value={formatPoints(stats.estimatedNetPnLPoints)}
            hint="Selected month estimated net P&L / lot size"
            icon={Target}
            accent={monthPointsAppearance.accent}
            valueClassName={monthPointsAppearance.valueClassName}
          />

          <StatCard
            title="Total Trades"
            value={String(stats.totalTrades)}
            icon={CandlestickChart}
            accent="cyan"
          />

          <StatCard
            title="Average Risk Reward"
            value={
              stats.averageRiskReward === null
                ? "N/A"
                : stats.averageRiskReward.toFixed(2)
            }
            hint="Defaulting to reward 3000 and risk 1500 where trade values are missing"
            icon={Target}
            accent="violet"
          />

          <StatCard
            title="Win Rate"
            value={`${stats.winRate.toFixed(2)}%`}
            icon={Trophy}
            accent="amber"
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <GroupPerformanceCard
            title="Setup-wise Performance"
            subtitle="See which setups actually make money"
            items={stats.setupPerformance}
            accent="cyan"
          />

          <GroupPerformanceCard
            title="Emotional-State Analysis"
            subtitle="Your emotional state versus trading results"
            items={stats.emotionalPerformance}
            accent="violet"
          />

          <OutcomeBreakdownCard items={stats.outcomeBreakdown} />
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <GroupPerformanceCard
            title="Market Condition"
            subtitle="How you perform in different market environments"
            items={stats.marketConditionPerformance}
            accent="green"
          />

          <MistakesCard mistakes={stats.mostCommonMistakes} />
        </section>

        <TradesTable trades={trades} />
      </div>
    </main>
  );
}