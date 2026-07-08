import type { Annotations } from '@/types/common'

/**
 * Read an annotation by its key suffix. Mocks and real data use fully-qualified
 * keys (e.g. `emeland.io/cluster`), so `annBySuffix(ann, 'cluster')` matches
 * both an exact key and any `.../cluster` key. Returns undefined when absent
 */
export function annBySuffix(annotations: Annotations, suffix: string): string | undefined {
  if (annotations[suffix] !== undefined) return annotations[suffix]
  const entry = Object.entries(annotations).find(([k]) => k === suffix || k.endsWith(`/${suffix}`))
  return entry?.[1]
}

export function formatTimestamp(iso: string | undefined): string | undefined {
  if (!iso) return undefined
  const s = iso.replace('T', ' ')
  return s.length >= 16 ? `${s.slice(0, 16)} UTC` : s
}

export interface InstanceMeta {
  cluster?: string
  namespace?: string
  lastUpdate?: string
}

export function instanceMeta(inst: { annotations: Annotations }): InstanceMeta {
  return {
    cluster: annBySuffix(inst.annotations, 'cluster'),
    namespace: annBySuffix(inst.annotations, 'namespace'),
    lastUpdate: formatTimestamp(annBySuffix(inst.annotations, 'last-update')),
  }
}
