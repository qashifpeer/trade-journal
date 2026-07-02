import { NextResponse } from 'next/server'
import { getSanityWriteClient } from '@/src/lib/sanity.client'
import { getOrCreateTag } from '@/src/lib/tag'

type SanityImageValue = {
  _type: 'image'
  asset: {
    _type: 'reference'
    _ref: string
  }
}

type IntradayTradeCreateDoc = {
  _type: 'intradayTrade'
  date: string
  numberOfTrades: number
  outcome: number
  charges: number
  netPnl: number
  notes: string
  tags: Array<{
    _type: 'reference'
    _ref: string
    _key: string
  }>
  indexImage?: SanityImageValue
  tradesImage?: SanityImageValue
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const date = body.date?.trim()
    const numberOfTrades = Number(body.numberOfTrades || 0)
    const outcome = Number(body.outcome || 0)
    const charges = Math.abs(Number(body.charges || 0))
    const notes = body.notes || ''
    const tagTitles: string[] = Array.isArray(body.tags) ? body.tags : []
    const indexImage: SanityImageValue | null = body.indexImage ?? null
    const tradesImage: SanityImageValue | null = body.tradesImage ?? null

    if (!date) {
      return NextResponse.json(
        { ok: false, error: 'Date is required' },
        { status: 400 }
      )
    }

    const client = getSanityWriteClient()

    const existing = await client.fetch(
      `*[_type == "intradayTrade" && date == $date][0]{_id}`,
      { date }
    )

    if (existing?._id) {
      return NextResponse.json(
        {
          ok: false,
          exists: true,
          error: 'Trade Already Saved',
          id: existing._id,
        },
        { status: 409 }
      )
    }

    const tagDocs = await Promise.all(tagTitles.map((tag) => getOrCreateTag(tag)))
    const netPnl = outcome - charges

    const doc: IntradayTradeCreateDoc = {
      _type: 'intradayTrade',
      date,
      numberOfTrades,
      outcome,
      charges,
      netPnl,
      notes,
      tags: tagDocs.map((tag) => ({
        _type: 'reference',
        _ref: tag._id,
        _key: crypto.randomUUID(),
      })),
    }

    if (indexImage?.asset?._ref) {
      doc.indexImage = indexImage
    }
    if (tradesImage?.asset?._ref) {
      doc.tradesImage = tradesImage
    }

    const result = await client.create(doc)

    return NextResponse.json(
      {
        ok: true,
        id: result._id,
        message: 'Trade saved successfully',
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Failed to save intraday trade' },
      { status: 500 }
    )
  }
}