import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/auth', () => ({
  getToken: () => undefined,
  login: vi.fn(),
  getAuthConfig: async () => ({ issuerUrl: '' }), // auth disabled -> plain fetch
}))

import { getJson, ApiHttpError, InvalidJsonError } from '@/api/fetch'

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('getJson', () => {
  it('returns the parsed body for a JSON 2xx response', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ ok: true })))
    await expect(getJson('/x', 'thing')).resolves.toEqual({ ok: true })
  })

  it('throws ApiHttpError with status and server error body on non-ok', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify('System not here'), { status: 404 }))
    const err = await getJson('/x', 'system s1').catch((e) => e)
    expect(err).toBeInstanceOf(ApiHttpError)
    expect(err.status).toBe(404)
    expect(err.message).toContain('system s1')
    expect(err.message).toContain('System not here')
  })

  it('throws ApiHttpError without detail when the error body is empty', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 500 }))
    const err = await getJson('/x', 'systems').catch((e) => e)
    expect(err).toBeInstanceOf(ApiHttpError)
    expect(err.message).toBe('Failed to load systems: 500')
  })

  it('throws InvalidJsonError when a 2xx body is not JSON', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response('<html>proxy error</html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      }),
    )
    const err = await getJson('/x', 'systems').catch((e) => e)
    expect(err).toBeInstanceOf(InvalidJsonError)
    expect(err.message).toContain('systems')
  })
})
