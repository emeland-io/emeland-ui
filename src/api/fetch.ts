import { getToken, login, getAuthConfig } from '@/auth'

let authEnabled: boolean | null = null

async function isAuthEnabled(): Promise<boolean> {
  if (authEnabled !== null) return authEnabled
  try {
    const cfg = await getAuthConfig()
    authEnabled = cfg.issuerUrl !== ''
  } catch {
    authEnabled = false
  }
  return authEnabled
}

/**
 * Fetch wrapper that attaches the auth token when auth is enabled.
 * Redirects to login if no token or 401 response.
 * Falls through to plain fetch if auth is disabled.
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  if (!(await isAuthEnabled())) {
    return fetch(path, init)
  }

  const token = getToken()
  if (!token) {
    await login()
    return new Response(null, { status: 401 })
  }

  const headers = new Headers(init?.headers)
  headers.set('Authorization', `Bearer ${token}`)

  const resp = await fetch(path, { ...init, headers })

  if (resp.status === 401) {
    await login()
    return resp
  }

  return resp
}
