import { NextResponse } from 'next/server'
import { getSanityWriteClient } from '@/src/lib/sanity.client'
import { getOrCreateTag } from '@/src/lib/tag'

type RouteContext = {
  params: Promise<{ id: string }>
}

type SanityImageValue = {
  _type: 'image'
  asset: {
    _type: 'reference'
    _ref: string
  }
}

type IntradayTradePatchInput = {
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
  indexImage?: SanityImageValue,
  tradesImage?: SanityImageValue,

}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await req.json()

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Document id is required' },
        { status: 400 }
      )
    }

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

    const conflictingEntry = await client.fetch(
      `
      *[
        _type == "intradayTrade" &&
        date == $date &&
        _id != $id
      ][0]{_id}
      `,
      { date, id }
    )

    if (conflictingEntry?._id) {
      return NextResponse.json(
        {
          ok: false,
          exists: true,
          error: 'Another trade already exists for this date',
          id: conflictingEntry._id,
        },
        { status: 409 }
      )
    }

    const tagDocs = await Promise.all(tagTitles.map((tag) => getOrCreateTag(tag)))
    const netPnl = outcome - charges

    const patchData: IntradayTradePatchInput = {
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
      patchData.indexImage = indexImage
    }
    if (tradesImage?.asset?._ref) {
      patchData.tradesImage = tradesImage
    }

    const updated = await client.patch(id).set(patchData).commit()

    return NextResponse.json({
      ok: true,
      id: updated._id,
      message: 'Trade updated successfully',
    })
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Failed to update intraday trade' },
      { status: 500 }
    )
  }
}