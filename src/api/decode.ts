import { z } from 'zod'
import type { ResourceType, Version } from '@/types/common'
import { isKnownResourceType } from '@/constants/resources'
import { useToasts } from '@/composables/useToasts'

export type AnnotationsResponse = { key: string; value: string }[] | Record<string, string>

export const annotationsResponseSchema = z.union([
  z.array(z.object({ key: z.string(), value: z.string() })),
  z.record(z.string(), z.string()),
])

export function decodeAnnotations(raw: AnnotationsResponse | undefined): Record<string, string> {
  if (!raw) return {}
  if (Array.isArray(raw)) return Object.fromEntries(raw.map((a) => [a.key, a.value]))
  return raw
}

export function decodeVersion(v: Version | undefined): Version {
  return { version: v?.version ?? '', ...v }
}

/**
 * Decode a resource type coming from the API
 */
export function decodeResourceType(raw: string): ResourceType {
  if (isKnownResourceType(raw)) return raw
  const message = `Resource type "${raw}" is valid in the API but not handled by the UI yet`
  // eslint-disable-next-line no-console -- intentional dev-mode diagnostics
  if (import.meta.env.DEV) console.error(`[api] ${message}`)
  useToasts().pushError(message)
  return 'Unknown'
}
