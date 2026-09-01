import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

let errorSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  vi.resetModules()
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

async function issuerAfterConfig(issuerUrl: unknown): Promise<string> {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ issuerUrl, clientId: 'ui', redirectUri: 'http://app/callback' }),
    }),
  )
  const { getAuthConfig } = await import('@/auth')
  return (await getAuthConfig()).issuerUrl
}

describe('getAuthConfig issuerUrl hardening', () => {
  it('accepts absolute http(s) urls', async () => {
    expect(await issuerAfterConfig('https://idp.example.com')).toBe('https://idp.example.com')
  })

  it('rejects non-http(s) schemes (redirect sink)', async () => {
    expect(await issuerAfterConfig('javascript:alert(1)')).toBe('')
    expect(await issuerAfterConfig('data:text/html,x')).toBe('')
  })

  it('rejects relative urls and non-strings', async () => {
    expect(await issuerAfterConfig('/idp')).toBe('')
    expect(await issuerAfterConfig(42)).toBe('')
  })

  it('keeps the empty issuerUrl (auth disabled) silent', async () => {
    expect(await issuerAfterConfig('')).toBe('')
    expect(errorSpy).not.toHaveBeenCalled()
  })
})
