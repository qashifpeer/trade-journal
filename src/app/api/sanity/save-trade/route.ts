// src/app/api/sanity/save-trade/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { writeClient } from '@/src/sanity/lib/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      fyersTradeId,
      symbol,
      direction,
      quantity,
      entryPrice,
      exitPrice,
      entryTime,
      exitTime,
      pnl,
      setup,
      tags,
      notes,
      mistakes,
      lessons,
      emotionalState,
      marketCondition,
      tradeDate,
    } = body

    // Create Sanity document
    const trade = await writeClient.create({
      _type: 'trade',
      fyersTradeId,
      symbol,
      direction,
      quantity,
      entryPrice,
      exitPrice,
      entryTime,
      exitTime,
      pnl,
      setup,
      tags,
      notes,
      mistakes,
      lessons,
      emotionalState,
      marketCondition,
      tradeDate,
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      trade,
    })
  } catch (error) {
    console.error('Sanity save error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save trade',
      },
      { status: 500 }
    )
  }
}
