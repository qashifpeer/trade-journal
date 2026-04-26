import { NextResponse } from 'next/server'
import { sanityClient } from '@/src//lib/sanity.client'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.date || !body.tradeType || !body.learnedLessons) {
      return NextResponse.json(
        { error: 'Date, trade type, and learned lessons are required.' },
        { status: 400 }
      )
    }

    const doc = await sanityClient.create({
      _type: 'tradeLog',
      date: body.date,
      tradeType: body.tradeType,
      entryTime: body.entryTime,
      exitTime: body.exitTime,
      exitReason: body.exitReason,
      quantity: body.quantity,
      result: body.result,
      mistakes: body.mistakes ?? [],
      emotionalState: body.emotionalState ?? [],
      learnedLessons: body.learnedLessons,
    })

    return NextResponse.json({ success: true, id: doc._id })
  } catch (error) {
    console.error('SANITY SAVE ERROR:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to save trade.',
      },
      { status: 500 }
    )
  }
}