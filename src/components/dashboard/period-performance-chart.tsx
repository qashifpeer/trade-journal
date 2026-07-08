"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardTrendPoint } from "@/src/types/intraday-dashboard";
import { DashboardPanel } from "@/src/components/dashboard/dashboard-panel";
import { ChartTooltip } from "@/src/components/dashboard/chart-tooltip";
import { formatSignedInr } from "@/src/lib/dashboard-format";

type PeriodPerformanceChartProps = {
  data: DashboardTrendPoint[];
};

export function PeriodPerformanceChart({
  data,
}: PeriodPerformanceChartProps) {
  return (
    <DashboardPanel
      title="Period performance"
      subtitle="Each bar shows net PNL for a day or grouped period segment."
    >
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
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
            <Bar dataKey="netPnl" name="Net PNL" radius={[10, 10, 4, 4]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${entry.label}-${index}`}
                  fill={entry.netPnl >= 0 ? "#34d399" : "#fb7185"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardPanel>
  );
}