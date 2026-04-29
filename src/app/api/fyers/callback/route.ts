import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const authCode = request.nextUrl.searchParams.get('auth_code')
    const status = request.nextUrl.searchParams.get('s')
    const code = request.nextUrl.searchParams.get('code')

    if (status !== 'ok' || code !== '200' || !authCode) {
      return NextResponse.json(
        {
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

    if (!appId || !secretKey) {
      return NextResponse.json(
        { error: 'Missing FYERS_APP_ID or FYERS_SECRET_KEY' },
        { status: 500 }
      )
    }

    const appIdHash = crypto
      .createHash('sha256')
      .update(`${appId}:${secretKey}`)
      .digest('hex')

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

    let tokenData: any
    try {
      tokenData = JSON.parse(raw)
    } catch {
      return NextResponse.json(
        {
          error: 'FYERS returned non-JSON response',
          raw,
        },
        { status: 500 }
      )
    }

    if (!tokenRes.ok || !tokenData.access_token) {
      return NextResponse.json(
        {
          error: 'Failed to exchange auth_code',
          status: tokenRes.status,
          details: tokenData,
        },
        { status: 500 }
      )
    }

    // const redirectUrl = new URL('/trade-details', request.url)
    // const response = NextResponse.redirect(redirectUrl, { status: 302 })

    const appUrl = process.env.APP_URL || 'http://localhost:3000'
    const redirectUrl = new URL('/trade-details', appUrl)
    const response = NextResponse.redirect(redirectUrl, { status: 302 })


    response.cookies.set('fyers_access_token', tokenData.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12,
    })

    return response
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Callback route crashed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}