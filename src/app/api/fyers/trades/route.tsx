// src/app/api/fyers/trades/route.ts - DEBUG VERSION
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
  console.log('🔍 Fetching tradebook with token:', accessToken.substring(0, 20) + '...')

  const tradebookRes = await fetch('https://api-t1.fyers.in/api/v3/tradebook', {
    method: 'GET',
    headers: {
      Authorization: accessToken,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  console.log('📡 FYERS tradebook HTTP status:', tradebookRes.status)

  const raw = await tradebookRes.text()
  console.log('📄 FYERS raw response:', raw.substring(0, 200))

  let data: RawFyersTradesResponse
  try {
    data = raw ? JSON.parse(raw) : {}
  } catch {
    throw new Error('FYERS returned non-JSON tradebook response')
  }

  console.log('✅ Parsed FYERS response:', JSON.stringify(data, null, 2))

  return {
    ok: tradebookRes.ok,
    status: tradebookRes.status,
    data,
  }
}

export async function GET() {
  try {
    console.log('\n🚀 === FYERS TRADES ROUTE START ===')

    const { accessToken, refreshToken } = await getStoredFyersTokens()

    console.log('🍪 Stored tokens:', {
      hasAccessToken: !!accessToken,
      accessTokenPreview: accessToken ? accessToken.substring(0, 20) + '...' : 'NONE',
      hasRefreshToken: !!refreshToken,
      refreshTokenPreview: refreshToken ? refreshToken.substring(0, 20) + '...' : 'NONE',
    })

    if (!accessToken) {
      console.log('⚠️ No access token found, trying refresh...')

      try {
        const refreshedAccessToken = await refreshFyersAccessToken()
        console.log('✅ Refresh succeeded, got new token:', refreshedAccessToken.substring(0, 20) + '...')

        const retryResult = await fetchTradebook(refreshedAccessToken)

        if (!retryResult.ok) {
          console.log('❌ Tradebook fetch failed after refresh')
          await clearFyersTokens()
          return NextResponse.json(
            {
              success: false,
              trades: [],
              error: retryResult.data.message || 'FYERS session expired. Please reconnect.',
              debug: {
                step: 'tradebook_after_refresh',
                status: retryResult.status,
                fyersResponse: retryResult.data,
              },
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
      } catch (refreshError) {
        console.log('❌ Refresh failed:', refreshError)
        await clearFyersTokens()
        return NextResponse.json(
          {
            success: false,
            trades: [],
            error: 'FYERS session expired. Please reconnect your broker.',
            debug: {
              step: 'refresh_failed',
              error: refreshError instanceof Error ? refreshError.message : String(refreshError),
            },
          },
          { status: 401 }
        )
      }
    }

    console.log('✅ Access token exists, fetching tradebook...')
    let result = await fetchTradebook(accessToken)

    if (!result.ok) {
      console.log('⚠️ First tradebook fetch failed, trying refresh...')

      try {
        const refreshedAccessToken = await refreshFyersAccessToken()
        console.log('✅ Refresh succeeded, retrying tradebook...')
        result = await fetchTradebook(refreshedAccessToken)
      } catch (refreshError) {
        console.log('❌ Refresh failed:', refreshError)
        await clearFyersTokens()
        return NextResponse.json(
          {
            success: false,
            trades: [],
            error: 'FYERS session expired. Please reconnect your broker.',
            debug: {
              step: 'refresh_after_401',
              error: refreshError instanceof Error ? refreshError.message : String(refreshError),
            },
          },
          { status: 401 }
        )
      }
    }

    if (!result.ok) {
      console.log('❌ Final tradebook fetch failed')
      await clearFyersTokens()
      return NextResponse.json(
        {
          success: false,
          trades: [],
          error: result.data.message || 'Failed to fetch FYERS tradebook',
          debug: {
            step: 'final_tradebook_failed',
            status: result.status,
            fyersResponse: result.data,
          },
        },
        { status: 401 }
      )
    }

    const rawTrades = Array.isArray(result.data.tradeBook)
      ? result.data.tradeBook
      : []

    const trades = mergeTrades(rawTrades)

    console.log('✅ Success! Returning', trades.length, 'trades')
    console.log('=== FYERS TRADES ROUTE END ===\n')

    return NextResponse.json({
      success: true,
      count: trades.length,
      trades,
    })
  } catch (error) {
    console.log('❌ Unexpected error:', error)
    return NextResponse.json(
      {
        success: false,
        trades: [],
        error: error instanceof Error ? error.message : 'Unexpected server error',
        debug: {
          step: 'catch_all',
          error: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 }
    )
  }
}
