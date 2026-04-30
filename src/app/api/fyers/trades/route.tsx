import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type FyersTrade = {
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
  ok?: boolean
  s?: string
  code?: number
  message?: string
  tradeBook?: FyersTrade[]
  [key: string]: unknown
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
    let data: RawFyersTradesResponse = {}

    try {
      data = rawText ? JSON.parse(rawText) : {}
    } catch {
      return NextResponse.json(
        { success: false, trades: [], error: 'Invalid JSON from FYERS' },
        { status: 502 }
      )
    }

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

    // Normalize FYERS field names to match your frontend expectations
    const rawTrades = Array.isArray(data.tradeBook) ? data.tradeBook : []
    
    const trades = rawTrades.map((t) => ({
      id: t.tradeNumber || t.orderNumber || '',
      orderId: t.orderNumber || '',
      symbol: t.symbol || '',
      side: t.side ?? null,
      qty: t.tradedQty ?? null,  // Map tradedQty to qty
      tradedPrice: t.tradePrice ?? null,  // Map tradePrice to tradedPrice
      orderDateTime: t.orderDateTime || '',
      tradeValue: t.tradeValue ?? null,
      productType: t.productType || '',
    }))

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
        error: error instanceof Error ? error.message : 'Server error',
      },
      { status: 500 }
    )
  }
}