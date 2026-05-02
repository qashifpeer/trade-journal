import { createClient } from 'next-sanity'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const apiVersion = '2024-01-01'
const token = process.env.SANITY_API_WRITE_TOKEN

export function getSanityClient() {
  if (!projectId || !dataset) {
    throw new Error('Missing Sanity project configuration')
  }

  return createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: true,
  })
}

export function getSanityWriteClient() {
  if (!projectId || !dataset || !token) {
    throw new Error('Missing Sanity write configuration')
  }

  return createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token,
  })
}