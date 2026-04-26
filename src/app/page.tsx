import TradeJournalForm from '@/src/components/trade-journal-form'

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-10 md:px-6 md:py-16">
      <div className="mb-8 space-y-3">
        <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-300">
          Next.js + Sanity Trade Logger
        </span>

        <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
          Single Trade Journal
        </h1>

        <p className="max-w-2xl text-sm text-slate-300 md:text-base">
          Save one trade at a time with trade type, timings, exit reason, quantity,
          result, mistakes, emotional state, and lessons learned.
        </p>
      </div>

      <TradeJournalForm />
    </main>
  )
}