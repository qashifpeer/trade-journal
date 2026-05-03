// src/components/dashboard/stat-card.tsx
import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  accent?: "cyan" | "violet" | "green" | "pink" | "amber";
};

const accentMap = {
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
};

export function StatCard({
  title,
  value,
  hint,
  icon: Icon,
  accent = "cyan",
}: StatCardProps) {
  const styles = accentMap[accent];

  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20 ${styles.glow}`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${styles.ring} opacity-90`}
      />
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-400">{title}</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight text-white">
              {value}
            </h3>
          </div>

          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${styles.badge}`}
          >
            <Icon className={`h-6 w-6 ${styles.icon}`} strokeWidth={2.2} />
          </div>
        </div>

        {hint ? (
          <p className="mt-4 text-xs leading-5 text-slate-500">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}