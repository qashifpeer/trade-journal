import crypto from 'crypto'
import { cookies } from 'next/headers'

type RefreshResponse = {
  s?: string
  code?: number
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

function getAppIdHash(appId: string, secretKey: string) {
  return crypto
    .createHash('sha256')
    .update(`${appId}:${secretKey}`)
    .digest('hex')
}

function extractTokens(data: RefreshResponse) {
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
  const cookieStore = await cookies()

  return {
    accessToken: cookieStore.get('fyers_access_token')?.value || '',
    refreshToken: cookieStore.get('fyers_refresh_token')?.value || '',
  }
}

export async function setFyersTokens(accessToken: string, refreshToken?: string) {
  const cookieStore = await cookies()

  cookieStore.set('fyers_access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
  })

  if (refreshToken) {
    cookieStore.set('fyers_refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 15,
    })
  }
}

export async function clearFyersTokens() {
  const cookieStore = await cookies()

  cookieStore.set('fyers_access_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  cookieStore.set('fyers_refresh_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
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

  let refreshData: RefreshResponse
  try {
    refreshData = raw ? JSON.parse(raw) : {}
  } catch {
    throw new Error('FYERS returned non-JSON refresh response')
  }

  const tokens = extractTokens(refreshData)

  if (!refreshRes.ok || !tokens.accessToken) {
    throw new Error(
      typeof refreshData.message === 'string'
        ? refreshData.message
        : 'Failed to refresh FYERS access token'
    )
  }

  await setFyersTokens(tokens.accessToken, tokens.refreshToken || refreshToken)

  return tokens.accessToken
}