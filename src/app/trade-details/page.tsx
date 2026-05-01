// src/app/trade-details/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type MergedTrade = {
  id: string
  symbol: string
  direction: 'Long' | 'Short'
  quantity: number
  buyPrice: number
  sellPrice: number
  buyTime: string
  sellTime: string
  totalPnl: number
}

type TradesApiResponse = {
  success?: boolean
  count?: number
  trades?: MergedTrade[]
  error?: string
  debug?: unknown
}

export default function TradeDetailsPage() {
  const router = useRouter()
  const [trades, setTrades] = useState<MergedTrade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savedTrades, setSavedTrades] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false

    const loadTrades = async () => {
      try {
        setLoading(true)
        setError('')

        const res = await fetch('/api/fyers/trades', {
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-store',
          },
        })

        const data: TradesApiResponse = await res.json()

        if (cancelled) return

        if (!res.ok || !data.success) {
          console.error('FYERS trades error:', data)
          setError(data.error || 'Failed to load FYERS trades')
          return
        }

        setTrades(Array.isArray(data.trades) ? data.trades : [])
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to fetch FYERS trades')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadTrades()

    const saved = localStorage.getItem('savedTrades')
    if (saved) {
      try {
        setSavedTrades(new Set(JSON.parse(saved)))
      } catch {}
    }

    return () => {
      cancelled = true
    }
  }, [])

  const handleSaveTrade = (trade: MergedTrade) => {
    const params = new URLSearchParams({
      id: trade.id,
      symbol: trade.symbol,
      direction: trade.direction,
      quantity: trade.quantity.toString(),
      buyPrice: trade.buyPrice.toString(),
      sellPrice: trade.sellPrice.toString(),
      buyTime: trade.buyTime,
      sellTime: trade.sellTime,
      totalPnl: trade.totalPnl.toString(),
    })

    router.push(`/save-trade?${params.toString()}`)
  }

  const formatPrice = (value: number) => `₹${value.toFixed(2)}`
  const formatPnl = (value: number) => `${value >= 0 ? '+' : '-'}₹${Math.abs(value).toFixed(2)}`
  const pnlColor = (value: number) => (value >= 0 ? 'text-emerald-400' : 'text-red-400')

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 text-white md:px-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trade Details</h1>
          <p className="mt-2 text-slate-300">
            Merged FYERS executed orders into complete journal-ready trades.
          </p>
        </div>

        <a
          href="/api/fyers/login"
          className="inline-flex rounded-2xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-600"
        >
          Connect FYERS
        </a>
      </div>

      {loading && (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-blue-300">
          Loading trades...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && trades.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-300">
          No complete trades found for this account right now.
        </div>
      )}

      {!loading && !error && trades.length > 0 && (
        <div className="mb-4 text-sm text-slate-400">
          Showing {trades.length} complete trade{trades.length === 1 ? '' : 's'}.
        </div>
      )}

      <div className="grid gap-4">
        {trades.map((trade) => {
          const isSaved = savedTrades.has(trade.id)

          return (
            <div
              key={trade.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-white/20"
            >
              <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-8">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Symbol
                  </p>
                  <p className="mt-1 break-all font-semibold">{trade.symbol}</p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Direction
                  </p>
                  <p
                    className={`mt-1 font-semibold ${
                      trade.direction === 'Long' ? 'text-emerald-400' : 'text-orange-400'
                    }`}
                  >
                    {trade.direction}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Quantity
                  </p>
                  <p className="mt-1 font-mono">{trade.quantity}</p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Buy Price
                  </p>
                  <p className="mt-1 font-mono">{formatPrice(trade.buyPrice)}</p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Sell Price
                  </p>
                  <p className="mt-1 font-mono">{formatPrice(trade.sellPrice)}</p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Buy Time
                  </p>
                  <p className="mt-1 text-sm text-slate-300">{trade.buyTime}</p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Sell Time
                  </p>
                  <p className="mt-1 text-sm text-slate-300">{trade.sellTime}</p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Total P&amp;L
                  </p>
                  <p className={`mt-1 font-mono font-semibold ${pnlColor(trade.totalPnl)}`}>
                    {formatPnl(trade.totalPnl)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleSaveTrade(trade)}
                disabled={isSaved}
                className={`mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  isSaved
                    ? 'bg-slate-600 text-slate-300'
                    : 'bg-emerald-500 text-slate-950 hover:bg-emerald-600'
                }`}
              >
                {isSaved ? 'Saved' : 'Save Trade'}
              </button>
            </div>
          )
        })}
      </div>
    </main>
  )
}