import { NextRequest, NextResponse } from 'next/server'
import {
  extractTokens,
  fyersCookieOptions,
  getAppIdHash,
} from '@/src/lib/fyers-auth'

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
          status,
          code,
          authCodePresent: !!authCode,
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

    let tokenData: FyersTokenPayload
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

    console.log('FYERS callback token response:', tokenData)
    console.log('Extracted tokens:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      accessPreview: accessToken ? accessToken.slice(0, 25) : '',
      refreshPreview: refreshToken ? refreshToken.slice(0, 25) : '',
    })

    if (!tokenRes.ok || !accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to exchange auth_code',
          fyersHttpStatus: tokenRes.status,
          fyersResponse: tokenData,
        },
        { status: 502 }
      )
    }

    const redirectUrl = new URL('/trade-details', appUrl)
    const response = NextResponse.redirect(redirectUrl, { status: 302 })

    response.cookies.set('fyers_access_token', accessToken, {
      ...fyersCookieOptions,
      maxAge: 60 * 60 * 12,
    })

    if (refreshToken) {
      response.cookies.set('fyers_refresh_token', refreshToken, {
        ...fyersCookieOptions,
        maxAge: 60 * 60 * 24 * 15,
      })
    }

    console.log('Set-Cookie callback complete:', {
      accessSet: !!accessToken,
      refreshSet: !!refreshToken,
      redirectTo: redirectUrl.toString(),
    })

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