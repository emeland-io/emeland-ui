import { ref } from 'vue'
import { reportError } from '@/utils/errors'
/**
 * Minimal OIDC Authorization Code flow (with PKCE).
 *
 * Configuration is read from /auth/config.json served by the web-ui-server,
 * or falls back to defaults for local development.
 */

const TOKEN_KEY = 'emeland_access_token'
const VERIFIER_KEY = 'emeland_pkce_verifier'

export const authenticated = ref(sessionStorage.getItem('emeland_access_token') !== null)

export interface AuthConfig {
  issuerUrl: string
  clientId: string
  redirectUri: string
}

let cachedConfig: AuthConfig | null = null

function safeIssuerUrl(url: unknown): string {
  if (typeof url !== 'string' || url === '') return ''
  try {
    const u = new URL(url)
    if (u.protocol === 'https:' || u.protocol === 'http:') return url
  } catch {
    // not an absolute URL
  }
  reportError('auth.config', new Error(`rejected issuerUrl (not absolute http(s)): ${url}`))
  return ''
}

export async function getAuthConfig(): Promise<AuthConfig> {
  if (cachedConfig) return cachedConfig

  try {
    const resp = await fetch('/auth/config.json')
    if (resp.ok) {
      const raw = (await resp.json()) as AuthConfig
      cachedConfig = { ...raw, issuerUrl: safeIssuerUrl(raw.issuerUrl) }
      return cachedConfig
    }
  } catch {
    // fall through to defaults
  }

  cachedConfig = {
    issuerUrl: '',
    clientId: '',
    redirectUri: window.location.origin + '/callback',
  }
  return cachedConfig
}

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY)
  authenticated.value = false
}

export async function login(): Promise<void> {
  const cfg = await getAuthConfig()
  const verifier = generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)
  sessionStorage.setItem(VERIFIER_KEY, verifier)

  // Encode return path in state (base64url JSON with CSRF nonce)
  const nonce = base64UrlEncode(crypto.getRandomValues(new Uint8Array(16)))
  const state = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify({ returnPath: window.location.pathname, nonce })),
  )

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    scope: 'openid profile email groups',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  })

  window.location.href = `${cfg.issuerUrl}/auth?${params}`
}

export async function handleCallback(): Promise<string | null> {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const state = params.get('state')
  if (!code) return null

  const cfg = await getAuthConfig()
  const verifier = sessionStorage.getItem(VERIFIER_KEY)
  if (!verifier) return null

  const resp = await fetch('/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: cfg.clientId,
      code,
      redirect_uri: cfg.redirectUri,
      code_verifier: verifier,
    }),
  })

  if (!resp.ok) return null

  const data = await resp.json()
  sessionStorage.setItem(TOKEN_KEY, data.access_token || data.id_token)
  sessionStorage.removeItem(VERIFIER_KEY)
  authenticated.value = true

  // Decode return path from state
  let returnPath = '/'
  if (state) {
    try {
      const decoded = JSON.parse(new TextDecoder().decode(base64UrlDecode(state)))
      if (decoded.returnPath) returnPath = decoded.returnPath
    } catch {
      // ignore malformed state
    }
  }

  return returnPath
}

// --- PKCE / encoding helpers ---

function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return base64UrlEncode(array)
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return base64UrlEncode(new Uint8Array(hash))
}

function base64UrlEncode(bytes: Uint8Array): string {
  let str = ''
  for (const b of bytes) str += String.fromCharCode(b)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(str: string): Uint8Array {
  const padded =
    str.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - (str.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}
