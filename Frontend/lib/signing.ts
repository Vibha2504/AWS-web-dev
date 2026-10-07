// Demo-only signature. A real backend would issue HMAC-SHA256 signatures server-side
// and never ship the secret to the client.
const DEMO_SECRET = 'campuspass-demo-secret'

export function signTicket(code: string): string {
  let h1 = 0x811c9dc5
  let h2 = 0x01000193
  const input = `${code}:${DEMO_SECRET}`
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 16777619) >>> 0
    h2 = Math.imul(h2 + c, 2246822519) >>> 0
  }
  return (h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')).toUpperCase()
}

export const TOKEN_PREFIX = 'CP1'

export function buildQrPayload(code: string, signature: string): string {
  return `${TOKEN_PREFIX}.${code}.${signature}`
}

export interface ParsedToken {
  code: string
  signature: string | null
}

export function parseToken(raw: string): ParsedToken | null {
  const value = raw.trim().toUpperCase()
  if (!value) return null
  const parts = value.split('.')
  if (parts.length === 3 && parts[0] === TOKEN_PREFIX) {
    return { code: parts[1], signature: parts[2] }
  }
  if (/^TKT-[A-Z]{4}-\d{5}$/.test(value)) {
    return { code: value, signature: null }
  }
  return null
}
