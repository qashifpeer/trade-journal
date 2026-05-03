// src/components/dashboard/insight-card.tsx
import type { LucideIcon } from "lucide-react";

type InsightCardProps = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconClassName?: string;
  children: React.ReactNode;
};

export function InsightCard({
  title,
  subtitle,
  icon: Icon,
  iconClassName = "text-cyan-300",
  children,
}: InsightCardProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-[0_0_40px_rgba(34,211,238,0.06)]">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
          <Icon className={`h-5 w-5 ${iconClassName}`} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="text-sm text-slate-400">{subtitle}</p>
        </div>
      </div>

      {children}
    </section>
  );
}