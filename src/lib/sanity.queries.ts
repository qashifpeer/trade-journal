// lib/sanity.queries.ts
import {groq} from 'next-sanity'

export const TAG_SUGGESTIONS_QUERY = groq`
  *[
    _type == "tag" &&
    (
      title match $pattern ||
      value match $pattern
    )
  ] | order(title asc)[0...10] {
    _id,
    title,
    value
  }
`