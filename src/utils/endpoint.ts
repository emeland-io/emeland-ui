import type { Annotations } from '@/types/common'

/**
 * Well-known `emeland.io/endpoint.*` annotation keys, declared on ApiInstance
 * resources. They describe where a deployed API is reachable on the network,
 * so external tooling (e.g. the certprobe service / OTel httpcheck receiver)
 * can run synthetic HTTP/TLS checks against it.
 *
 * Registry: https://emeland.io/docs/example-mapping/p1-structure/#apiinstance
 */
export const ENDPOINT = {
  protocol: 'emeland.io/endpoint.protocol',
  host: 'emeland.io/endpoint.host',
  port: 'emeland.io/endpoint.port',
  path: 'emeland.io/endpoint.path',
} as const

/**
 * Builds the probe URL from endpoint annotations:
 *
 *   {protocol}://{host}:{port}{path}
 *
 * Registry rules:
 * - without `endpoint.host` the instance is not a probe target -> undefined
 * - port defaults to 443 (https) / 80 (http)
 * - path defaults to `/`; a missing leading slash is added
 *
 * `protocol` is required by the registry; when absent we fall back to `https`
 * (lenient display choice, the registry default only covers port/path).
 */
export function endpointUrl(annotations: Annotations): string | undefined {
  const host = annotations[ENDPOINT.host]?.trim()
  if (!host) return undefined
  const protocol = annotations[ENDPOINT.protocol]?.trim() || 'https'
  const port = annotations[ENDPOINT.port]?.trim() || (protocol === 'http' ? '80' : '443')
  let path = annotations[ENDPOINT.path]?.trim() || '/'
  if (!path.startsWith('/')) path = `/${path}`
  return `${protocol}://${host}:${port}${path}`
}
