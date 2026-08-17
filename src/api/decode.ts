import type { Version } from '@/types/common'

export interface InstanceListItem {
  instanceId: string
  displayName: string
  reference: string
}

export type AnnotationsResponse = { key: string; value: string }[] | Record<string, string>

export function decodeAnnotations(raw: AnnotationsResponse | undefined): Record<string, string> {
  if (!raw) return {}
  if (Array.isArray(raw)) return Object.fromEntries(raw.map((a) => [a.key, a.value]))
  return raw
}

export function decodeVersion(v: Version | undefined): Version {
  return { version: v?.version ?? '', ...v }
}
