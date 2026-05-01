import crypto from 'crypto'
import { cookies } from 'next/headers'

type FyersTokenPayload = {
  s?: string
  code?: number | string
  message?: string
  access_token?: string
  accessToken?: string
  data?: {
    access_token?: string
    accessToken?: string
  }
  [key: string]: unknown
}

const ACCESS_COOKIE = 'fyers_access_token'

export const fyersCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
  path: '/',
}

export function getAppIdHash(appId: string, secretKey: string) {
  return crypto
    .createHash('sha256')
    .update(`${appId}:${secretKey}`)
    .digest('hex')
}

export function extractAccessToken(data: FyersTokenPayload) {
  return (
    data.access_token ||
    data.accessToken ||
    data.data?.access_token ||
    data.data?.accessToken ||
    ''
  )
}

export async function getStoredFyersAccessToken() {
  const store = await cookies()
  return store.get(ACCESS_COOKIE)?.value || ''
}

export async function setStoredFyersAccessToken(accessToken: string) {
  const store = await cookies()

  store.set(ACCESS_COOKIE, accessToken, {
    ...fyersCookieOptions,
    maxAge: 60 * 60 * 12,
  })
}

export async function clearStoredFyersAccessToken() {
  const store = await cookies()

  store.set(ACCESS_COOKIE, '', {
    ...fyersCookieOptions,
    maxAge: 0,
  })
}