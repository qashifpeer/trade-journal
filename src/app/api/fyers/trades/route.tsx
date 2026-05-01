import { NextResponse } from 'next/server'
import {
  clearFyersTokens,
  getStoredFyersTokens,
  refreshFyersAccessToken,
} from '@/src/lib/fyers-auth'

export const dynamic = 'force-dynamic'

type RawFyersTrade = {
  clientId?: string
  exchange?: number
  fyToken?: string
  orderNumber?: string
  exchangeOrderNo?: string
  tradeNumber?: string
  tradePrice?: number
  segment?: number
  productType?: string
  tradedQty?: number
  symbol?: string
  row?: number
  orderDateTime?: string
  tradeValue?: number
  side?: number
  orderType?: number
  orderTag?: string
}

type RawFyersTradesResponse = {
  code?: number
  message?: string
  s?: string
  tradeBook?: RawFyersTrade[]
  [key: string]: unknown
}

type OpenLot = {
  qty: number
  price: number
  time: string
  side: number
}

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

function parseFyersDate(value?: string) {
  if (!value) return new Date(0)

  const [datePart, timePart] = value.split(' ')
  if (!datePart || !timePart) return new Date(value)

  const [day, monStr, year] = datePart.split('-')
  const months: Record<string, number> = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  }

  return new Date(
    Number(year),
    months[monStr],
    Number(day),
    ...timePart.split(':').map(Number)
  )
}

function getDirection(symbol: string): 'Long' | 'Short' {
  return symbol.endsWith('PE') ? 'Short' : 'Long'
}

function mergeTrades(rawTrades: RawFyersTrade[]): MergedTrade[] {
  const grouped = new Map<string, RawFyersTrade[]>()

  for (const trade of rawTrades) {
    const symbol = trade.symbol || ''
    if (!symbol) continue
    if (!grouped.has(symbol)) grouped.set(symbol, [])
    grouped.get(symbol)!.push(trade)
  }

  const merged: MergedTrade[] = []

  for (const [symbol, trades] of grouped.entries()) {
    const sorted = [...trades].sort(
      (a, b) =>
        parseFyersDate(a.orderDateTime).getTime() -
        parseFyersDate(b.orderDateTime).getTime()
    )

    const openLots: OpenLot[] = []

    for (const trade of sorted) {
      const qty = trade.tradedQty ?? 0
      const price = trade.tradePrice ?? 0
      const time = trade.orderDateTime ?? ''
      const side = trade.side ?? 0

      if (!qty || !price || !side) continue

      if (openLots.length === 0) {
        openLots.push({ qty, price, time, side })
        continue
      }

      let remainingQty = qty

      while (remainingQty > 0 && openLots.length > 0) {
        const firstLot = openLots[0]

        if (firstLot.side === side) break

        const matchedQty = Math.min(firstLot.qty, remainingQty)

        const buyPrice = firstLot.side === 1 ? firstLot.price : price
        const sellPrice = firstLot.side === -1 ? firstLot.price : price
        const buyTime = firstLot.side === 1 ? firstLot.time : time
        const sellTime = firstLot.side === -1 ? firstLot.time : time

        const totalPnl = (sellPrice - buyPrice) * matchedQty

        merged.push({
          id: `${symbol}-${buyTime}-${sellTime}-${matchedQty}`,
          symbol,
          direction: getDirection(symbol),
          quantity: matchedQty,
          buyPrice,
          sellPrice,
          buyTime,
          sellTime,
          totalPnl,
        })

        firstLot.qty -= matchedQty
        remainingQty -= matchedQty

        if (firstLot.qty === 0) {
          openLots.shift()
        }
      }

      if (remainingQty > 0) {
        openLots.push({
          qty: remainingQty,
          price,
          time,
          side,
        })
      }
    }
  }

  return merged
}

async function fetchTradebook(accessToken: string) {
  const tradebookRes = await fetch('https://api-t1.fyers.in/api/v3/tradebook', {
    method: 'GET',
    headers: {
      Authorization: accessToken,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  const raw = await tradebookRes.text()

  let data: RawFyersTradesResponse
  try {
    data = raw ? JSON.parse(raw) : {}
  } catch {
    throw new Error('FYERS returned non-JSON tradebook response')
  }

  return {
    ok: tradebookRes.ok,
    status: tradebookRes.status,
    data,
  }
}

export async function GET() {
  try {
    const { accessToken } = await getStoredFyersTokens()

    if (!accessToken) {
      try {
        const refreshedAccessToken = await refreshFyersAccessToken()
        const retryResult = await fetchTradebook(refreshedAccessToken)

        if (!retryResult.ok) {
          await clearFyersTokens()
          return NextResponse.json(
            {
              success: false,
              trades: [],
              error: retryResult.data.message || 'FYERS session expired. Please reconnect.',
            },
            { status: 401 }
          )
        }

        const rawTrades = Array.isArray(retryResult.data.tradeBook)
          ? retryResult.data.tradeBook
          : []

        return NextResponse.json({
          success: true,
          count: mergeTrades(rawTrades).length,
          trades: mergeTrades(rawTrades),
        })
      } catch {
        await clearFyersTokens()
        return NextResponse.json(
          {
            success: false,
            trades: [],
            error: 'FYERS session expired. Please reconnect your broker.',
          },
          { status: 401 }
        )
      }
    }

    let result = await fetchTradebook(accessToken)

    if (!result.ok) {
      try {
        const refreshedAccessToken = await refreshFyersAccessToken()
        result = await fetchTradebook(refreshedAccessToken)
      } catch {
        await clearFyersTokens()
        return NextResponse.json(
          {
            success: false,
            trades: [],
            error: 'FYERS session expired. Please reconnect your broker.',
          },
          { status: 401 }
        )
      }
    }

    if (!result.ok) {
      await clearFyersTokens()
      return NextResponse.json(
        {
          success: false,
          trades: [],
          error: result.data.message || 'Failed to fetch FYERS tradebook',
        },
        { status: 401 }
      )
    }

    const rawTrades = Array.isArray(result.data.tradeBook)
      ? result.data.tradeBook
      : []

    const trades = mergeTrades(rawTrades)

    return NextResponse.json({
      success: true,
      count: trades.length,
      trades,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        trades: [],
        error: error instanceof Error ? error.message : 'Unexpected server error',
      },
      { status: 500 }
    )
  }
}