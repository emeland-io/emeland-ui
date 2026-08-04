import { describe, it, expect } from 'vitest'
import { endpointUrl, ENDPOINT } from '@/utils/endpoint'

describe('endpointUrl', () => {
  it('builds the full probe URL per the registry', () => {
    expect(
      endpointUrl({
        [ENDPOINT.protocol]: 'https',
        [ENDPOINT.host]: 'payments.prod.eu.example.com',
        [ENDPOINT.port]: '443',
        [ENDPOINT.path]: '/api/v1/health',
      }),
    ).toBe('https://payments.prod.eu.example.com:443/api/v1/health')
  })

  it('is not a probe target without a host', () => {
    expect(endpointUrl({})).toBeUndefined()
    expect(endpointUrl({ [ENDPOINT.protocol]: 'https' })).toBeUndefined()
  })

  it('defaults the port from the protocol', () => {
    expect(endpointUrl({ [ENDPOINT.protocol]: 'https', [ENDPOINT.host]: 'h' })).toBe(
      'https://h:443/',
    )
    expect(endpointUrl({ [ENDPOINT.protocol]: 'http', [ENDPOINT.host]: 'h' })).toBe(
      'http://h:80/',
    )
  })

  it('defaults the path to / and adds a missing leading slash', () => {
    expect(
      endpointUrl({ [ENDPOINT.protocol]: 'https', [ENDPOINT.host]: 'h', [ENDPOINT.path]: 'api' }),
    ).toBe('https://h:443/api')
  })

  it('respects a declared custom port', () => {
    expect(
      endpointUrl({
        [ENDPOINT.protocol]: 'http',
        [ENDPOINT.host]: 'prometheus.internal',
        [ENDPOINT.port]: '9090',
      }),
    ).toBe('http://prometheus.internal:9090/')
  })

  it('falls back to https when the protocol is absent (lenient display)', () => {
    expect(endpointUrl({ [ENDPOINT.host]: 'h' })).toBe('https://h:443/')
  })
})
