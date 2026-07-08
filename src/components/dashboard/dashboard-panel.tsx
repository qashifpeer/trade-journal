import { ReactNode } from "react";

type DashboardPanelProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  rightSlot?: ReactNode;
};

export function DashboardPanel({
  title,
  subtitle,
  children,
  rightSlot,
}: DashboardPanelProps) {
  return (
    <section className="rounded-[28px] border border-cyan-400/15 bg-slate-950/55 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-6">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
          ) : null}
        </div>

        {rightSlot ? <div>{rightSlot}</div> : null}
      </div>

      {children}
    </section>
  );
}