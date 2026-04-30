'use client'

import { useEffect, useState } from 'react'

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
}

export default function TradeDetailsPage() {
  const [trades, setTrades] = useState<MergedTrade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [importingId, setImportingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadTrades = async () => {
      try {
        setLoading(true)
        setError('')

        const res = await fetch('/api/fyers/trades', {
          credentials: 'include',
          cache: 'no-store',
        })

        const data: TradesApiResponse = await res.json()

        if (cancelled) return

        if (!res.ok || !data.success) {
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

    return () => {
      cancelled = true
    }
  }, [])

  const handleImport = async (trade: MergedTrade) => {
    setImportingId(trade.id)
    setMessage('')

    try {
      const res = await fetch('/api/fyers/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trade),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || 'Import failed')
        return
      }

      setMessage(`Imported successfully: ${trade.symbol}`)
    } catch {
      setMessage('Import failed')
    } finally {
      setImportingId(null)
    }
  }

  const formatPrice = (value: number) => `₹${value.toFixed(2)}`

  const formatPnl = (value: number) =>
    `${value >= 0 ? '+' : '-'}₹${Math.abs(value).toFixed(2)}`

  const pnlColor = (value: number) =>
    value >= 0 ? 'text-emerald-400' : 'text-red-400'

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

      {message && (
        <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-400">
          {message}
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
          const isImporting = importingId === trade.id

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
                  <p className="mt-1 font-semibold break-all">{trade.symbol}</p>
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
                onClick={() => handleImport(trade)}
                disabled={isImporting}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isImporting ? 'Importing...' : 'Import to Sanity Draft'}
              </button>
            </div>
          )
        })}
      </div>
    </main>
  )
}