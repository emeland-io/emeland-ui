import type { Annotations } from '@/types/common'

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

export interface WellKnownAnnotation {
  suffix: string
  label: string
  format?: (raw: string) => string | undefined
}

/**
 * Catalog of annotations the Backend and UI recognizes
 */
export const WELL_KNOWN_ANNOTATIONS: WellKnownAnnotation[] = [
  { suffix: 'last-update', label: 'Last update', format: formatTimestamp },
  // TODO: Add more
]

export interface WellKnownAnnotationRow {
  key: string
  label: string
  value: string
}

export function wellKnownAnnotations(annotations: Annotations): WellKnownAnnotationRow[] {
  const rows: WellKnownAnnotationRow[] = []
  for (const def of WELL_KNOWN_ANNOTATIONS) {
    const raw = annBySuffix(annotations, def.suffix)
    if (raw === undefined) continue
    const value = def.format ? def.format(raw) : raw
    if (!value) continue
    rows.push({ key: def.suffix, label: def.label, value })
  }
  return rows
}

export function differingAnnotationKeys(items: Annotations[]): string[] {
  if (items.length < 2) return []
  const keys = new Set<string>()
  for (const annotations of items) {
    for (const key of Object.keys(annotations)) keys.add(key)
  }
  return [...keys]
    .filter((key) => {
      const first = items[0][key]
      return items.some((annotations) => annotations[key] !== first)
    })
    .sort()
}
