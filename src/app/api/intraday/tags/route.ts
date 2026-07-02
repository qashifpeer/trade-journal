// app/api/intraday/tags/route.ts
import {NextResponse} from 'next/server'
import {getSanityClient} from '@/src/lib/sanity.client'
import {TAG_SUGGESTIONS_QUERY} from '@/src/lib/sanity.queries'

export async function GET(req: Request) {
  const {searchParams} = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()

  if (!q) {
    return NextResponse.json({tags: []})
  }
const fetchTags = getSanityClient()
  const tags = await fetchTags.fetch(TAG_SUGGESTIONS_QUERY, {
    pattern: `${q}*`,
  })

  return NextResponse.json({tags})
}