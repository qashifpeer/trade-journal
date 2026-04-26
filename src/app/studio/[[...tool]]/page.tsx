import type { Metadata, Viewport } from 'next'
import {
  metadata as studioMetadata,
  viewport as studioViewport,
} from 'next-sanity/studio'
import StudioClient from './StudioClient'

export const metadata: Metadata = studioMetadata
export const viewport: Viewport = studioViewport

export default function StudioPage() {
  return <StudioClient />
}