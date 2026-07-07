"use client";

import { ReactNode } from "react";
import { formatSignedInr } from "@/src/lib/dashboard-format";

type NeonStatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "cyan" | "green" | "red" | "violet" | "amber";
  icon?: ReactNode;
  isCurrency?: boolean;
};

const accentMap: Record<NonNullable<NeonStatCardProps["accent"]>, string> = {
  cyan: "from-cyan-500/20 via-cyan-400/10 to-transparent border-cyan-400/20 shadow-cyan-500/10",
  green: "from-emerald-500/20 via-emerald-400/10 to-transparent border-emerald-400/20 shadow-emerald-500/10",
  red: "from-rose-500/20 via-rose-400/10 to-transparent border-rose-400/20 shadow-rose-500/10",
  violet: "from-violet-500/20 via-fuchsia-400/10 to-transparent border-violet-400/20 shadow-violet-500/10",
  amber: "from-amber-500/20 via-yellow-400/10 to-transparent border-amber-400/20 shadow-amber-500/10",
};

const glowDotMap: Record<NonNullable<NeonStatCardProps["accent"]>, string> = {
  cyan: "bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.8)]",
  green: "bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.8)]",
  red: "bg-rose-400 shadow-[0_0_18px_rgba(251,113,133,0.8)]",
  violet: "bg-violet-400 shadow-[0_0_18px_rgba(167,139,250,0.8)]",
  amber: "bg-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.8)]",
};

const valueColorMap: Record<NonNullable<NeonStatCardProps["accent"]>, string> = {
  cyan: "text-cyan-300",
  green: "text-emerald-300",
  red: "text-rose-300",
  violet: "text-violet-300",
  amber: "text-amber-300",
};

export function NeonStatCard({
  label,
  value,
  hint,
  accent = "cyan",
  icon,
  isCurrency = false,
}: NeonStatCardProps) {
  const numericValue =
    typeof value === "number" ? value : Number(value);

  const displayValue =
    typeof value === "number" && isCurrency ? formatSignedInr(value) : value;

  const valueClass =
    isCurrency && !Number.isNaN(numericValue)
      ? numericValue > 0
        ? "text-emerald-300"
        : numericValue < 0
        ? "text-rose-300"
        : "text-white"
      : valueColorMap[accent];

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border bg-slate-950/60 p-5 backdrop-blur-xl shadow-2xl ${accentMap[accent]}`}
    >
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br opacity-80" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${glowDotMap[accent]}`} />
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
              {label}
            </p>
          </div>

          <div className={`text-3xl font-semibold tracking-tight md:text-4xl ${valueClass}`}>
            {displayValue}
          </div>

          {hint ? (
            <p className="text-sm text-slate-400">{hint}</p>
          ) : null}
        </div>

        {icon ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-200">
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}