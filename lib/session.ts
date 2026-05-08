// HMAC-signed session cookie for the shared-passcode gate.
// Token format: "<timestamp>.<base64url-hmac>". Verify by recomputing the HMAC.

const COOKIE_NAME = 'gw_session'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days

const encoder = new TextEncoder()

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET not set')
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToBytes(s: string): Uint8Array<ArrayBuffer> {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export async function signToken(): Promise<string> {
  const payload = String(Date.now())
  const key = await getKey()
  const sig = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, encoder.encode(payload)),
  )
  return `${payload}.${bytesToBase64Url(sig)}`
}

export async function verifyToken(token: string | undefined): Promise<boolean> {
  if (!token) return false
  const [payload, sigB64] = token.split('.')
  if (!payload || !sigB64) return false
  try {
    const key = await getKey()
    const sig = base64UrlToBytes(sigB64)
    return await crypto.subtle.verify(
      'HMAC',
      key,
      sig,
      encoder.encode(payload),
    )
  } catch {
    return false
  }
}

export const SESSION_COOKIE_NAME = COOKIE_NAME
export const SESSION_MAX_AGE = MAX_AGE
