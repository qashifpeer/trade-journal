import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.FYERS_APP_ID
  const redirectUri = process.env.FYERS_REDIRECT_URI

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: 'Missing FYERS_CLIENT_ID or FYERS_REDIRECT_URI' },
      { status: 500 }
    )
  }

  const authUrl =
    `https://api-t1.fyers.in/api/v3/generate-authcode?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code&state=trade-journal`

  return NextResponse.redirect(authUrl)
}