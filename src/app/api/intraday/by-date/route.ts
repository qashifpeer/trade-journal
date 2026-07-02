import { NextResponse } from 'next/server'
import { getSanityWriteClient } from '@/src/lib/sanity.client'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')?.trim()

    if (!date) {
      return NextResponse.json(
        { ok: false, error: 'Date is required' },
        { status: 400 }
      )
    }

    const query = `
      *[_type == "intradayTrade" && date == $date][0]{
        _id,
        date,
        numberOfTrades,
        outcome,
        charges,
        netPnl,
        notes,
        tags[]->{
          _id,
          title,
          value
        },
        "indexImageUrl": indexImage.asset->url
      }
    `

    const client = getSanityWriteClient()
    const entry = await client.fetch(query, { date })

    if (!entry) {
      return NextResponse.json({
        ok: true,
        exists: false,
        entry: null,
      })
    }

    return NextResponse.json({
      ok: true,
      exists: true,
      entry,
    })
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Failed to check trade by date' },
      { status: 500 }
    )
  }
}