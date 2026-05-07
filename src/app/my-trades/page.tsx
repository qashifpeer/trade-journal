// src/app/myTrades/page.tsx
import { Table2 } from "lucide-react";
import { TradesTable } from "@/src/components/dashboard/trades-table";
import { getAllTrades } from "@/src/lib/trades";

export default async function MyTradesPage() {
  const trades = await getAllTrades();

  return (
    <main className="min-h-screen bg-[#0a0f1f] bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.10),_transparent_30%),radial-gradient(circle_at_right,_rgba(168,85,247,0.10),_transparent_25%),linear-gradient(180deg,_#0a0f1f_0%,_#0b1120_100%)] px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-[0_0_60px_rgba(34,211,238,0.08)]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10">
              <Table2 className="h-6 w-6 text-cyan-300" />
            </div>

            <div>
              <p className="mb-1 text-xs uppercase tracking-[0.22em] text-cyan-300/80">
                Trade Journal
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-white">
                My Trades
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                View all saved trades.
              </p>
            </div>
          </div>
        </header>

        <TradesTable trades={trades} />
      </div>
    </main>
  );
}