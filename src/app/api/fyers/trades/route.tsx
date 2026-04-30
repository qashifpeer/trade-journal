import { NextRequest, NextResponse } from 'next/server'

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
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
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

        if (firstLot.side === side) {
          break
        }

        const matchedQty = Math.min(firstLot.qty, remainingQty)

        const buyPrice = side === -1 ? firstLot.price : price
        const sellPrice = side === -1 ? price : firstLot.price
        const buyTime = side === -1 ? firstLot.time : time
        const sellTime = side === -1 ? time : firstLot.time

        const totalPnl =
          symbol.endsWith('PE')
            ? (buyPrice - sellPrice) * matchedQty
            : (sellPrice - buyPrice) * matchedQty

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

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('fyers_access_token')?.value
    const appId = process.env.FYERS_APP_ID

    if (!accessToken) {
      return NextResponse.json(
        { success: false, trades: [], error: 'Missing FYERS access token' },
        { status: 401 }
      )
    }

    if (!appId) {
      return NextResponse.json(
        { success: false, trades: [], error: 'Missing FYERS_APP_ID' },
        { status: 500 }
      )
    }

    const fyersRes = await fetch('https://api-t1.fyers.in/api/v3/tradebook', {
      method: 'GET',
      headers: {
        Authorization: `${appId}:${accessToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    const rawText = await fyersRes.text()
    const data: RawFyersTradesResponse = rawText ? JSON.parse(rawText) : {}

    if (!fyersRes.ok) {
      return NextResponse.json(
        {
          success: false,
          trades: [],
          error: data.message || 'Failed to fetch FYERS tradebook',
        },
        { status: fyersRes.status }
      )
    }

    const rawTrades = Array.isArray(data.tradeBook) ? data.tradeBook : []
    const mergedTrades = mergeTrades(rawTrades)

    return NextResponse.json({
      success: true,
      count: mergedTrades.length,
      trades: mergedTrades,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        trades: [],
        error: error instanceof Error ? error.message : 'Server error',
      },
      { status: 500 }
    )
  }
}