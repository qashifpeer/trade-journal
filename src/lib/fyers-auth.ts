import crypto from 'crypto'
import { cookies } from 'next/headers'

type FyersTokenPayload = {
  s?: string
  code?: number | string
  message?: string
  access_token?: string
  refresh_token?: string
  accessToken?: string
  refreshToken?: string
  data?: {
    access_token?: string
    refresh_token?: string
    accessToken?: string
    refreshToken?: string
  }
  [key: string]: unknown
}

const ACCESS_COOKIE = 'fyers_access_token'
const REFRESH_COOKIE = 'fyers_refresh_token'

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

export function extractTokens(data: FyersTokenPayload) {
  const accessToken =
    data.access_token ||
    data.accessToken ||
    data.data?.access_token ||
    data.data?.accessToken ||
    ''

  const refreshToken =
    data.refresh_token ||
    data.refreshToken ||
    data.data?.refresh_token ||
    data.data?.refreshToken ||
    ''

  return { accessToken, refreshToken }
}

export async function getStoredFyersTokens() {
  const store = await cookies()

  const accessToken = store.get(ACCESS_COOKIE)?.value || ''
  const refreshToken = store.get(REFRESH_COOKIE)?.value || ''

  return { accessToken, refreshToken }
}

export async function setStoredFyersTokens(params: {
  accessToken: string
  refreshToken?: string
}) {
  const store = await cookies()

  store.set(ACCESS_COOKIE, params.accessToken, {
    ...fyersCookieOptions,
    maxAge: 60 * 60 * 12,
  })

  if (params.refreshToken) {
    store.set(REFRESH_COOKIE, params.refreshToken, {
      ...fyersCookieOptions,
      maxAge: 60 * 60 * 24 * 15,
    })
  }
}

export async function clearStoredFyersTokens() {
  const store = await cookies()

  store.set(ACCESS_COOKIE, '', {
    ...fyersCookieOptions,
    maxAge: 0,
  })

  store.set(REFRESH_COOKIE, '', {
    ...fyersCookieOptions,
    maxAge: 0,
  })
}

export async function refreshFyersAccessToken() {
  const appId = process.env.FYERS_APP_ID
  const secretKey = process.env.FYERS_SECRET_KEY
  const pin = process.env.FYERS_PIN

  if (!appId || !secretKey || !pin) {
    throw new Error('Missing FYERS_APP_ID, FYERS_SECRET_KEY, or FYERS_PIN')
  }

  const { refreshToken } = await getStoredFyersTokens()

  if (!refreshToken) {
    throw new Error('Missing FYERS refresh token')
  }

  const appIdHash = getAppIdHash(appId, secretKey)

  const refreshRes = await fetch(
    'https://api-t1.fyers.in/api/v3/validate-refresh-token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        appIdHash,
        refresh_token: refreshToken,
        pin,
      }),
      cache: 'no-store',
    }
  )

  const raw = await refreshRes.text()

  let refreshData: FyersTokenPayload
  try {
    refreshData = raw ? JSON.parse(raw) : {}
  } catch {
    throw new Error('FYERS returned non-JSON refresh response')
  }

  const { accessToken, refreshToken: newRefreshToken } = extractTokens(refreshData)

  console.log('FYERS refresh response:', refreshData)
  console.log('FYERS refresh extracted:', {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!newRefreshToken,
  })

  if (!refreshRes.ok || !accessToken) {
    throw new Error(
      typeof refreshData.message === 'string'
        ? refreshData.message
        : 'Failed to refresh FYERS access token'
    )
  }

  await setStoredFyersTokens({
    accessToken,
    refreshToken: newRefreshToken || refreshToken,
  })

  return accessToken
}