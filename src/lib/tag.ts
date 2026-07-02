import { getSanityWriteClient } from './sanity.client'

export function normalizeTag(input: string) {
  return input.trim().toLowerCase()
}

export async function getOrCreateTag(title: string) {
  const cleanTitle = title.trim()
  const value = normalizeTag(cleanTitle)
const clientFetch = getSanityWriteClient()
  const existing = await clientFetch.fetch(
    `*[_type == "tag" && value == $value][0]{_id, title, value}`,
    { value }
  )

  if (existing?._id) return existing

  return clientFetch.create({
    _type: 'tag',
    title: cleanTitle,
    value,
  })
}