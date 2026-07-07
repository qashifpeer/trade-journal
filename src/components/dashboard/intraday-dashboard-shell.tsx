"use client";

import { useEffect, useMemo, useState } from "react";
import { NeonStatCard } from "@/src/components/dashboard/neon-stat-card";
import {
  PeriodControls,
  getDefaultPeriodValue,
} from "@/src/components/dashboard/period-controls";
import {
  ChargesIcon,
  DayIcon,
  PnlIcon,
  TradesIcon,
} from "@/src/components/dashboard/dashboard-icons";
import { DashboardPanel } from "@/src/components/dashboard/dashboard-panel";
import {
  DashboardPeriodType,
  IntradayDashboardData,
} from "@/src/types/intraday-dashboard";
import { formatSignedInr } from "@/src/lib/dashboard-format";
import { PnlTrendChart } from "@/src/components/dashboard/pnl-trend-chart";
import { PeriodPerformanceChart } from "@/src/components/dashboard/period-performance-chart";
import { TagInsights } from "@/src/components/dashboard/tag-insights";
import { DaywiseTable } from "@/src/components/dashboard/daywise-table";

export function IntradayDashboardShell() {
  const [periodType, setPeriodType] = useState<DashboardPeriodType>("monthly");
  const [value, setValue] = useState<string>(getDefaultPeriodValue("monthly"));
  const [data, setData] = useState<IntradayDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    return `/api/intraday/dashboard?periodType=${periodType}&value=${encodeURIComponent(value)}`;
  }, [periodType, value]);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(queryString, { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const json: IntradayDashboardData = await response.json();

        if (active) {
          setData(json);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Something went wrong");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [queryString]);

  function handlePeriodTypeChange(next: DashboardPeriodType) {
    setPeriodType(next);
    setValue(getDefaultPeriodValue(next));
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#061018] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(167,139,250,0.14),transparent_24%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.12),transparent_26%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:32px_32px] opacity-25" />

      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
        <section className="rounded-[32px] border border-cyan-400/15 bg-slate-950/60 p-6 shadow-[0_25px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-cyan-300">
                Trading Journey Overview
              </div>

              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
                  Performance Dashboard
                </h1>
              </div>
            </div>

            <div className="min-w-0 lg:min-w-[360px]">
              <PeriodControls
                periodType={periodType}
                value={value}
                onPeriodTypeChange={handlePeriodTypeChange}
                onValueChange={setValue}
              />
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <NeonStatCard
            label="Net PNL"
            value={data?.summary.netPnl || 0}
            isCurrency
            accent={(data?.summary.netPnl || 0) >= 0 ? "green" : "red"}
            hint={data ? data.periodLabel : "Loading..."}
            icon={<PnlIcon />}
          />
          <NeonStatCard
            label="Gross PNL"
            value={data?.summary.grossPnl || 0}
            isCurrency
            accent="cyan"
            hint="Before charges"
            icon={<PnlIcon />}
          />
          <NeonStatCard
            label="Charges"
            value={-Math.abs(data?.summary.totalCharges || 0)}
            isCurrency
            accent="amber"
            hint="Total cost in selected period"
            icon={<ChargesIcon />}
          />
          <NeonStatCard
            label="Total Trades"
            value={data?.summary.totalTrades || 0}
            accent="violet"
            hint={`${data?.summary.tradingDays || 0} trading days`}
            icon={<TradesIcon />}
          />
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <NeonStatCard
            label="Avg / Day"
            value={data?.summary.avgNetPnlPerDay || 0}
            isCurrency
            accent="cyan"
            hint="Average net PNL per trading day"
            icon={<DayIcon />}
          />
          <NeonStatCard
            label="Green Days"
            value={data?.summary.greenDays || 0}
            accent="green"
            hint={`${data?.summary.redDays || 0} red days`}
            icon={<DayIcon />}
          />
          <NeonStatCard
            label="Best Day"
            value={data?.summary.bestDay?.netPnl || 0}
            isCurrency
            accent="green"
            hint={data?.summary.bestDay?.date || "—"}
            icon={<PnlIcon />}
          />
          <NeonStatCard
            label="Worst Day"
            value={data?.summary.worstDay?.netPnl || 0}
            isCurrency
            accent="red"
            hint={data?.summary.worstDay?.date || "—"}
            icon={<PnlIcon />}
          />
        </section>

        {loading ? (
          <DashboardPanel
            title="Loading analytics"
            subtitle="Fetching your period summary, chart points, and tag breakdown."
          >
            <div className="grid gap-3 md:grid-cols-3">
              <div className="h-28 rounded-2xl bg-white/5 animate-pulse" />
              <div className="h-28 rounded-2xl bg-white/5 animate-pulse" />
              <div className="h-28 rounded-2xl bg-white/5 animate-pulse" />
            </div>
          </DashboardPanel>
        ) : data ? (
          <>
            <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <PnlTrendChart data={data.trend} />
              <PeriodPerformanceChart data={data.trend} />
            </section>

            <TagInsights
              topPositiveTags={data.topPositiveTags}
              topNegativeTags={data.topNegativeTags}
              mostUsedTags={data.mostUsedTags}
            />

            <DaywiseTable rows={data.days} />
          </>
        ) : (
          <DashboardPanel
            title="No data"
            subtitle="Your dashboard will light up once trading entries exist in the selected period."
          >
            <div className="text-sm text-slate-500">No records found.</div>
          </DashboardPanel>
        )}
      </main>
    </div>
  );
}
