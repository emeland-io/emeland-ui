import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/auth', () => ({
  getToken: vi.fn(),
  login: vi.fn(async () => {}),
  getAuthConfig: vi.fn(),
}))

/**
 * apiFetch caches the auth-enabled probe in module state, so every test gets
 * a fresh module instance
 */
async function setup(config: { issuerUrl?: string; token?: string | null; probeFails?: boolean }) {
  vi.resetModules()
  vi.clearAllMocks()
  const auth = await import('@/auth')
  const getAuthConfig = vi.mocked(auth.getAuthConfig)
  if (config.probeFails) {
    getAuthConfig.mockRejectedValue(new Error('discovery down'))
  } else {
    getAuthConfig.mockResolvedValue({
      issuerUrl: config.issuerUrl ?? '',
      clientId: 'client',
      redirectUri: 'http://localhost/callback',
    })
  }
  vi.mocked(auth.getToken).mockReturnValue(config.token ?? null)
  const { apiFetch } = await import('@/api/fetch')
  return { apiFetch, auth }
}

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset().mockResolvedValue(new Response('{}', { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('apiFetch', () => {
  it('passes through to plain fetch when auth is disabled', async () => {
    const { apiFetch, auth } = await setup({ issuerUrl: '' })
    const init = { method: 'GET' }

    const resp = await apiFetch('/api/systems', init)
    expect(resp.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledWith('/api/systems', init)
    expect(auth.getToken).not.toHaveBeenCalled()
    expect(auth.login).not.toHaveBeenCalled()
  })

  it('treats a failing auth-config probe as auth disabled', async () => {
    const { apiFetch, auth } = await setup({ probeFails: true })

    await apiFetch('/api/systems')
    expect(fetchMock).toHaveBeenCalledWith('/api/systems', undefined)
    expect(auth.login).not.toHaveBeenCalled()
  })

  it('redirects to login and short-circuits with 401 when no token is present', async () => {
    const { apiFetch, auth } = await setup({ issuerUrl: 'https://idp.example', token: null })

    const resp = await apiFetch('/api/systems')
    expect(auth.login).toHaveBeenCalledTimes(1)
    expect(resp.status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('attaches the bearer token when auth is enabled', async () => {
    const { apiFetch, auth } = await setup({ issuerUrl: 'https://idp.example', token: 'tok-123' })

    const resp = await apiFetch('/api/systems')
    expect(resp.status).toBe(200)
    expect(auth.login).not.toHaveBeenCalled()

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer tok-123')
  })

  it('re-triggers login on a 401 response and returns it', async () => {
    const { apiFetch, auth } = await setup({ issuerUrl: 'https://idp.example', token: 'stale' })
    fetchMock.mockResolvedValue(new Response(null, { status: 401 }))

    const resp = await apiFetch('/api/systems')
    expect(auth.login).toHaveBeenCalledTimes(1)
    expect(resp.status).toBe(401)
  })

  it('probes the auth config only once across calls', async () => {
    const { apiFetch, auth } = await setup({ issuerUrl: '' })

    await apiFetch('/one')
    await apiFetch('/two')
    expect(auth.getAuthConfig).toHaveBeenCalledTimes(1)
  })
})
