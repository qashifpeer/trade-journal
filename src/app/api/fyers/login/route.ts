import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const clientId = process.env.FYERS_APP_ID
  const redirectUri = process.env.FYERS_REDIRECT_URI

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing FYERS_APP_ID or FYERS_REDIRECT_URI',
      },
      { status: 500 }
    )
  }

  const authUrl = new URL('https://api-t1.fyers.in/api/v3/generate-authcode')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('state', 'trade-journal')

  console.log('FYERS login redirect:', {
    clientId,
    redirectUri,
    authUrl: authUrl.toString(),
  })

  return NextResponse.redirect(authUrl.toString(), { status: 302 })
}