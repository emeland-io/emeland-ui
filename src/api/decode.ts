import { z } from 'zod'
import type { Version } from '@/types/common'

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
