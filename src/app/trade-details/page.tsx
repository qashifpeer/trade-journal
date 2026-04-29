'use client'

import { useEffect, useState } from 'react'

type FyersTrade = {
  id?: string
  orderId?: string
  symbol?: string
  side?: number
  qty?: number
  tradedPrice?: number
  orderDateTime?: string
}

type TradesApiResponse = {
  success?: boolean
  count?: number
  trades?: FyersTrade[]
  error?: string
}

export default function TradeDetailsPage() {
  const [trades, setTrades] = useState<FyersTrade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [importingId, setImportingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadTrades = async () => {
      try {
        const res = await fetch('/api/fyers/trades', {
          credentials: 'include',
          cache: 'no-store',
        })

        if (cancelled) return

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

  const handleImport = async (trade: FyersTrade) => {
    const tradeId = trade.id || trade.orderId || Math.random().toString()

    setImportingId(tradeId)
    setMessage('')

    try {
      const res = await fetch('/api/fyers/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trade),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || 'Import failed')
        return
      }

      setMessage(`✓ Imported successfully: ${trade.symbol || 'Trade'}`)
    } catch {
      setMessage('Import failed')
    } finally {
      setImportingId(null)
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 text-white md:px-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trade Details</h1>
          <p className="mt-2 text-slate-300">
            Fetch FYERS trades and import them as draft journal entries.
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
          <strong>Error:</strong> {error}
        </div>
      )}

      {message && (
        <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-400">
          {message}
        </div>
      )}

      {!loading && !error && trades.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-300">
          <p className="text-lg font-medium">No trades found</p>
          <p className="mt-2 text-sm text-slate-400">
            Your FYERS tradebook is currently empty. Trades will appear here after execution.
          </p>
        </div>
      )}

      {!loading && !error && trades.length > 0 && (
        <>
          <div className="mb-4 text-sm text-slate-400">
            Showing {trades.length} trade{trades.length === 1 ? '' : 's'}
          </div>

          <div className="grid gap-4">
            {trades.map((trade, index) => {
              const tradeId = trade.id || trade.orderId || String(index)
              const isImporting = importingId === tradeId

              return (
                <div
                  key={tradeId}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-white/20"
                >
                  <div className="grid gap-4 md:grid-cols-5">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Symbol
                      </p>
                      <p className="mt-1 font-semibold">{trade.symbol || '-'}</p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Side
                      </p>
                      <p
                        className={`mt-1 font-semibold ${
                          trade.side === 1
                            ? 'text-emerald-400'
                            : trade.side === -1
                            ? 'text-red-400'
                            : ''
                        }`}
                      >
                        {trade.side === 1 ? 'Buy' : trade.side === -1 ? 'Sell' : '-'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Quantity
                      </p>
                      <p className="mt-1 font-mono">{trade.qty ?? '-'}</p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Price
                      </p>
                      <p className="mt-1 font-mono">
                        {trade.tradedPrice != null
                          ? `₹${trade.tradedPrice.toFixed(2)}`
                          : '-'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Time
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        {trade.orderDateTime
                          ? new Date(trade.orderDateTime).toLocaleString('en-IN', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : '-'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleImport(trade)}
                    disabled={isImporting}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isImporting ? (
                      <>
                        <svg
                          className="h-4 w-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Importing...
                      </>
                    ) : (
                      'Import to Sanity Draft'
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </>
      )}
    </main>
  )
}