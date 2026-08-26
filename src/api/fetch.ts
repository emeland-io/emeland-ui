import { getToken, login, getAuthConfig } from '@/auth'

export const USE_MOCKS = import.meta.env.VITE_EMEL_DEV_USE_MOCKS === 'true'

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

/** A non-2xx response, carries the status and the server's error body when readable */
export class ApiHttpError extends Error {
  readonly what: string
  readonly status: number
  readonly detail?: string

  constructor(what: string, status: number, detail?: string) {
    super(`Failed to load ${what}: ${status}${detail ? ` — ${detail}` : ''}`)
    this.name = 'ApiHttpError'
    this.what = what
    this.status = status
    this.detail = detail
  }
}

/** A 2xx response whose body is not JSON */
export class InvalidJsonError extends Error {
  readonly what: string

  constructor(what: string) {
    super(`Invalid JSON in response for ${what}`)
    this.name = 'InvalidJsonError'
    this.what = what
  }
}

/** Best-effort read of a non-ok error body (the spec's ErrorString is a plain JSON string) */
async function readErrorDetail(resp: Response): Promise<string | undefined> {
  try {
    const raw = (await resp.text()).trim()
    if (!raw) return undefined
    try {
      const parsed: unknown = JSON.parse(raw)
      if (typeof parsed === 'string') return parsed
      if (parsed && typeof parsed === 'object') {
        const rec = parsed as Record<string, unknown>
        return String(rec.message ?? rec.detail ?? rec.title ?? raw)
      }
      return raw
    } catch {
      return raw
    }
  } catch {
    return undefined
  }
}

/** Fetch a JSON payload, throwing typed errors for HTTP and JSON failures */
export async function getJson<T>(path: string, what: string): Promise<T> {
  const resp = await apiFetch(path)
  if (!resp.ok) throw new ApiHttpError(what, resp.status, await readErrorDetail(resp))
  try {
    return (await resp.json()) as T
  } catch {
    throw new InvalidJsonError(what)
  }
}
