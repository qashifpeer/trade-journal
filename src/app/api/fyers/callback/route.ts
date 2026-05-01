import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

type FyersTokenResponse = {
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

function extractTokens(tokenData: FyersTokenResponse) {
  const accessToken =
    tokenData.access_token ||
    tokenData.accessToken ||
    tokenData.data?.access_token ||
    tokenData.data?.accessToken ||
    ''

  const refreshToken =
    tokenData.refresh_token ||
    tokenData.refreshToken ||
    tokenData.data?.refresh_token ||
    tokenData.data?.refreshToken ||
    ''

  return { accessToken, refreshToken }
}

export async function GET(request: NextRequest) {
  try {
    const authCode = request.nextUrl.searchParams.get('auth_code')
    const status = request.nextUrl.searchParams.get('s')
    const code = request.nextUrl.searchParams.get('code')

    if (status !== 'ok' || code !== '200' || !authCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid auth_code response from FYERS',
          fyersStatus: status,
          fyersCode: code,
          authCodePresent: Boolean(authCode),
        },
        { status: 400 }
      )
    }

    const appId = process.env.FYERS_APP_ID
    const secretKey = process.env.FYERS_SECRET_KEY
    const appUrl = process.env.APP_URL || request.nextUrl.origin

    if (!appId || !secretKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing FYERS_APP_ID or FYERS_SECRET_KEY',
        },
        { status: 500 }
      )
    }

    const appIdHash = getAppIdHash(appId, secretKey)

    const tokenRes = await fetch('https://api-t1.fyers.in/api/v3/validate-authcode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        appIdHash,
        code: authCode,
      }),
      cache: 'no-store',
    })

    const raw = await tokenRes.text()

    let tokenData: FyersTokenResponse
    try {
      tokenData = raw ? JSON.parse(raw) : {}
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'FYERS returned non-JSON response',
          raw,
        },
        { status: 502 }
      )
    }

    const { accessToken, refreshToken } = extractTokens(tokenData)

    if (!tokenRes.ok || !accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to exchange auth_code with FYERS',
          fyersHttpStatus: tokenRes.status,
          fyersResponse: tokenData,
        },
        { status: 502 }
      )
    }

    const redirectUrl = new URL('/trade-details', appUrl)
    const response = NextResponse.redirect(redirectUrl, { status: 302 })

    response.cookies.set('fyers_access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12,
    })

    if (refreshToken) {
      response.cookies.set('fyers_refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 15,
      })
    }

    return response
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Callback route crashed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}