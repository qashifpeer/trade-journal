// src/components/dashboard/stat-card.tsx
import type { LucideIcon } from "lucide-react";

type Accent = "cyan" | "violet" | "green" | "pink" | "amber" | "red";

type AccentStyles = {
  ring: string;
  icon: string;
  glow: string;
  badge: string;
};

type StatCardProps = {
  title: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  accent?: Accent;
  valueClassName?: string;
  className?: string;
};

const accentMap: Record<Accent, AccentStyles> = {
  cyan: {
    ring: "from-cyan-400/20 to-cyan-500/5",
    icon: "text-cyan-300",
    glow: "shadow-[0_0_30px_rgba(34,211,238,0.14)]",
    badge: "bg-cyan-400/10 border-cyan-300/20",
  },
  violet: {
    ring: "from-violet-400/20 to-violet-500/5",
    icon: "text-violet-300",
    glow: "shadow-[0_0_30px_rgba(168,85,247,0.14)]",
    badge: "bg-violet-400/10 border-violet-300/20",
  },
  green: {
    ring: "from-emerald-400/20 to-emerald-500/5",
    icon: "text-emerald-300",
    glow: "shadow-[0_0_30px_rgba(16,185,129,0.14)]",
    badge: "bg-emerald-400/10 border-emerald-300/20",
  },
  pink: {
    ring: "from-pink-400/20 to-pink-500/5",
    icon: "text-pink-300",
    glow: "shadow-[0_0_30px_rgba(236,72,153,0.14)]",
    badge: "bg-pink-400/10 border-pink-300/20",
  },
  amber: {
    ring: "from-amber-400/20 to-amber-500/5",
    icon: "text-amber-300",
    glow: "shadow-[0_0_30px_rgba(251,191,36,0.14)]",
    badge: "bg-amber-400/10 border-amber-300/20",
  },
  red: {
    ring: "from-rose-400/20 to-red-500/5",
    icon: "text-rose-300",
    glow: "shadow-[0_0_30px_rgba(244,63,94,0.16)]",
    badge: "bg-rose-400/10 border-rose-300/20",
  },
};

const cardBaseClass =
  "group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20";

const contentClass = "relative z-10";
const titleClass = "text-sm text-slate-400";
const valueBaseClass = "mt-3 text-3xl font-semibold tracking-tight";
const hintClass = "mt-4 text-xs leading-5 text-slate-500";
const badgeBaseClass =
  "flex h-12 w-12 items-center justify-center rounded-2xl border";

export function StatCard({
  title,
  value,
  hint,
  icon: Icon,
  accent = "cyan",
  valueClassName,
  className,
}: StatCardProps) {
  const styles = accentMap[accent];

  return (
    <div className={`${cardBaseClass} ${styles.glow} ${className ?? ""}`}>
      <div
        className={`absolute inset-0 bg-gradient-to-br ${styles.ring} opacity-90`}
      />

      <div className={contentClass}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className={titleClass}>{title}</p>
            <h3 className={`${valueBaseClass} ${valueClassName ?? "text-white"}`}>
              {value}
            </h3>
          </div>

          <div className={`${badgeBaseClass} ${styles.badge}`}>
            <Icon className={`h-6 w-6 ${styles.icon}`} strokeWidth={2.2} />
          </div>
        </div>

        {hint ? <p className={hintClass}>{hint}</p> : null}
      </div>
    </div>
  );
}