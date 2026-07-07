"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardTrendPoint } from "@/src/types/intraday-dashboard";
import { DashboardPanel } from "@/src/components/dashboard/dashboard-panel";
import { ChartTooltip } from "@/src/components/dashboard/chart-tooltip";
import { formatSignedInr } from "@/src/lib/dashboard-format";

type PnlTrendChartProps = {
  data: DashboardTrendPoint[];
};

export function PnlTrendChart({ data }: PnlTrendChartProps) {
  return (
    <DashboardPanel
      title="Cumulative net PNL"
      subtitle="See whether the period was compounding upward or leaking over time."
    >
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="trendGlow" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="rgba(148,163,184,0.10)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatSignedInr(Number(value))}
              width={90}
            />
            <Tooltip content={<ChartTooltip />} />
            <Line
              type="monotone"
              dataKey="cumulativeNetPnl"
              name="Cumulative PNL"
              stroke="url(#trendGlow)"
              strokeWidth={3}
              dot={{ r: 3, fill: "#22d3ee", strokeWidth: 0 }}
              activeDot={{ r: 6, fill: "#a78bfa", stroke: "#fff", strokeWidth: 1 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </DashboardPanel>
  );
}