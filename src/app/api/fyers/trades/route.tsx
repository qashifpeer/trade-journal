import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type FyersTrade = {
  id?: string
  orderId?: string
  symbol?: string
  side?: number
  qty?: number
  tradedPrice?: number
  orderDateTime?: string
}

type RawFyersTradesResponse = {
  ok?: boolean
  s?: string
  code?: number
  message?: string
  tradeBook?: FyersTrade[]
  trades?: FyersTrade[]
  orderBook?: FyersTrade[]
  [key: string]: unknown
}

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('fyers_access_token')?.value
    const appId = process.env.FYERS_APP_ID

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          trades: [],
          error: 'Missing FYERS access token',
        },
        { status: 401 }
      )
    }

    if (!appId) {
      return NextResponse.json(
        {
          success: false,
          trades: [],
          error: 'Missing FYERS_APP_ID in environment variables',
        },
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
        {
          success: false,
          trades: [],
          error: 'Invalid JSON returned by FYERS',
          raw: rawText,
        },
        { status: 502 }
      )
    }

    if (!fyersRes.ok) {
      return NextResponse.json(
        {
          success: false,
          trades: [],
          error:
            typeof data.message === 'string'
              ? data.message
              : 'Failed to fetch FYERS tradebook',
          fyersStatus: fyersRes.status,
          fyersResponse: data,
        },
        { status: fyersRes.status }
      )
    }

    const trades = Array.isArray(data.tradeBook)
      ? data.tradeBook
      : Array.isArray(data.trades)
      ? data.trades
      : Array.isArray(data.orderBook)
      ? data.orderBook
      : []

    return NextResponse.json(
      {
        success: true,
        count: trades.length,
        trades,
      },
      { status: 200 }
    )
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