import { NextResponse } from 'next/server'
import { randomBytes, createHash } from 'crypto'

const SCOPES = [
  'design:content:read',
  'design:content:write',
  'design:meta:read',
  'asset:read',
  'asset:write',
  'brandtemplate:content:read',
  'brandtemplate:meta:read',
].join(' ')

function base64url(buf: Buffer) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export async function GET() {
  const codeVerifier  = base64url(randomBytes(32))
  const codeChallenge = base64url(createHash('sha256').update(codeVerifier).digest())
  const state         = randomBytes(16).toString('hex')

  const params = new URLSearchParams({
    response_type:          'code',
    client_id:              process.env.CANVA_CLIENT_ID!,
    redirect_uri:           process.env.CANVA_REDIRECT_URI!,
    scope:                  SCOPES,
    state,
    code_challenge:         codeChallenge,
    code_challenge_method:  'S256',
  })

  const url = `https://www.canva.com/api/oauth/authorize?${params}`

  const res = NextResponse.redirect(url)
  // Store verifier in cookie for the callback
  res.cookies.set('canva_cv', codeVerifier, { httpOnly: true, maxAge: 600, path: '/' })
  res.cookies.set('canva_state', state,        { httpOnly: true, maxAge: 600, path: '/' })
  return res
}
