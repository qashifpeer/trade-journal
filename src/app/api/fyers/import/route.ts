import { NextResponse } from 'next/server'
import { writeClient } from '@/src/lib/sanity.client'

function toDateOnly(value?: string) {
  if (!value) return new Date().toISOString().split('T')[0]
  const d = new Date(value)
  return isNaN(d.getTime())
    ? new Date().toISOString().split('T')[0]
    : d.toISOString().split('T')[0]
}

function toTimeOnly(value?: string) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const brokerTradeId = body.id || body.orderId || crypto.randomUUID()
    const tradeDate = toDateOnly(body.orderDateTime)
    const entryTime = toTimeOnly(body.orderDateTime)

    const draftId = `drafts.fyers-${brokerTradeId}`

    const doc = await writeClient.createOrReplace({
      _id: draftId,
      _type: 'tradeLog',
      date: tradeDate,
      tradeType: body.side === 1 ? 'Call' : 'Put',
      entryTime,
      exitTime: '',
      exitReason: 'Other',
      quantity: Number(body.qty || 0),
      result: 0,
      mistakes: [],
      emotionalState: [],
      learnedLessons: '',
      broker: 'FYERS',
      brokerTradeId: String(brokerTradeId),
      symbol: body.symbol || '',
      entryPrice: Number(body.tradedPrice || 0),
      importStatus: 'draft',
    })

    return NextResponse.json({
      success: true,
      id: doc._id,
      message: 'Trade imported as draft journal entry.',
    })
  } catch (error) {
    console.error('FYERS IMPORT ERROR:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to import trade',
      },
      { status: 500 }
    )
  }
}