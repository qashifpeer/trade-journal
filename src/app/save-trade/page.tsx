// src/app/save-trade/page.tsx
'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function SaveTradeForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // FYERS data from URL params
  const [tradeId] = useState(searchParams.get('id') || '')
  const [symbol] = useState(searchParams.get('symbol') || '')
  const [direction] = useState(searchParams.get('direction') || '')
  const [quantity] = useState(Number(searchParams.get('quantity')) || 0)
  const [buyPrice] = useState(Number(searchParams.get('buyPrice')) || 0)
  const [sellPrice] = useState(Number(searchParams.get('sellPrice')) || 0)
  const [buyTime] = useState(searchParams.get('buyTime') || '')
  const [sellTime] = useState(searchParams.get('sellTime') || '')
  const [totalPnl] = useState(Number(searchParams.get('totalPnl')) || 0)

  // Additional fields
  const [setup, setSetup] = useState('')
  const [tags, setTags] = useState('')
  const [notes, setNotes] = useState('')
  const [mistakes, setMistakes] = useState('')
  const [lessons, setLessons] = useState('')
  const [emotionalState, setEmotionalState] = useState('')
  const [marketCondition, setMarketCondition] = useState('')

  const handleSave = async () => {
    setLoading(true)
    setError('')

    try {
      const tradeData = {
        // FYERS data
        fyersTradeId: tradeId,
        symbol,
        direction,
        quantity,
        entryPrice: buyPrice,
        exitPrice: sellPrice,
        entryTime: buyTime,
        exitTime: sellTime,
        pnl: totalPnl,

        // Additional fields
        setup,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        notes,
        mistakes,
        lessons,
        emotionalState,
        marketCondition,

        // Metadata
        tradeDate: new Date(buyTime).toISOString(),
        createdAt: new Date().toISOString(),
      }

      const res = await fetch('/api/sanity/save-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tradeData),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to save trade')
        return
      }

      // Mark as saved in localStorage
      const saved = localStorage.getItem('savedTrades')
      const savedSet = saved ? new Set(JSON.parse(saved)) : new Set()
      savedSet.add(tradeId)
      localStorage.setItem('savedTrades', JSON.stringify([...savedSet]))

      // Redirect back to trade-details
      router.push('/trade-details')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save trade')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 text-white md:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Save Trade to Journal</h1>
        <p className="mt-2 text-slate-300">
          Review FYERS data and add additional details before saving.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* FYERS Data Section */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold">FYERS Trade Data</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-slate-400">Symbol</label>
              <p className="mt-1 font-mono text-lg">{symbol}</p>
            </div>

            <div>
              <label className="text-sm text-slate-400">Direction</label>
              <p
                className={`mt-1 text-lg font-semibold ${
                  direction === 'Long' ? 'text-emerald-400' : 'text-orange-400'
                }`}
              >
                {direction}
              </p>
            </div>

            <div>
              <label className="text-sm text-slate-400">Quantity</label>
              <p className="mt-1 font-mono text-lg">{quantity}</p>
            </div>

            <div>
              <label className="text-sm text-slate-400">Entry Price</label>
              <p className="mt-1 font-mono text-lg">₹{buyPrice.toFixed(2)}</p>
            </div>

            <div>
              <label className="text-sm text-slate-400">Exit Price</label>
              <p className="mt-1 font-mono text-lg">₹{sellPrice.toFixed(2)}</p>
            </div>

            <div>
              <label className="text-sm text-slate-400">P&L</label>
              <p
                className={`mt-1 font-mono text-lg font-semibold ${
                  totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {totalPnl >= 0 ? '+' : '-'}₹{Math.abs(totalPnl).toFixed(2)}
              </p>
            </div>

            <div>
              <label className="text-sm text-slate-400">Entry Time</label>
              <p className="mt-1 text-sm">{buyTime}</p>
            </div>

            <div>
              <label className="text-sm text-slate-400">Exit Time</label>
              <p className="mt-1 text-sm">{sellTime}</p>
            </div>
          </div>
        </div>

        {/* Additional Details Section */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold">Additional Details</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Setup/Strategy
              </label>
              <input
                type="text"
                value={setup}
                onChange={(e) => setSetup(e.target.value)}
                placeholder="e.g., Breakout, Support/Resistance, Momentum"
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., scalp, intraday, options"
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">
                Market Condition
              </label>
              <select
                value={marketCondition}
                onChange={(e) => setMarketCondition(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              >
                <option value="">Select...</option>
                <option value="trending">Trending</option>
                <option value="ranging">Ranging</option>
                <option value="volatile">Volatile</option>
                <option value="calm">Calm</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">
                Emotional State
              </label>
              <select
                value={emotionalState}
                onChange={(e) => setEmotionalState(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              >
                <option value="">Select...</option>
                <option value="confident">Confident</option>
                <option value="calm">Calm</option>
                <option value="anxious">Anxious</option>
                <option value="fearful">Fearful</option>
                <option value="greedy">Greedy</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">
                Trade Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What was your reasoning for this trade?"
                rows={3}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">
                Mistakes
              </label>
              <textarea
                value={mistakes}
                onChange={(e) => setMistakes(e.target.value)}
                placeholder="What went wrong or could be improved?"
                rows={3}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">
                Lessons Learned
              </label>
              <textarea
                value={lessons}
                onChange={(e) => setLessons(e.target.value)}
                placeholder="What did you learn from this trade?"
                rows={3}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold transition-colors hover:bg-white/10"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950 transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Saving...' : 'Save to Sanity'}
          </button>
        </div>
      </div>
    </main>
  )
}

export default function SaveTradePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-white">
          Loading...
        </div>
      }
    >
      <SaveTradeForm />
    </Suspense>
  )
}
