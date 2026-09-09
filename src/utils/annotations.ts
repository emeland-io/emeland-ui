import type { Annotations } from '@/types/common'
import { GENERATED_ANNOTATIONS } from '@/annotations/catalog.gen'

/** Registry guidance levels from the modelsrv annotation registries */
export type AnnotationLevel = 'required' | 'recommended' | 'optional'

/** Display hints the YAML catalog may carry */
export type AnnotationFormat = 'timestamp'

/** One catalog entry as generated from the YAML source */
export interface GeneratedAnnotation {
  /** full annotation key (emeland.io/…) */
  key: string
  /** key without the emeland.io/ prefix; matched via annBySuffix */
  suffix: string
  label: string
  /** what the annotation declares (registry purpose) */
  purpose: string
  /** example value */
  example: string
  /** resource kinds the key is documented for */
  appliesTo: string
  /** registry group (drives the settings overview sections) */
  category: string
  level?: AnnotationLevel
  format?: AnnotationFormat
}

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

export interface WellKnownAnnotation extends Omit<GeneratedAnnotation, 'format'> {
  /** display formatter, resolved from the catalog's format hint */
  format?: (raw: string) => string | undefined
}

/**
 * Catalog of the annotations the backend and UI recognize (`npm run annotations:gen`)
 */
export const WELL_KNOWN_ANNOTATIONS: WellKnownAnnotation[] = GENERATED_ANNOTATIONS.map((def) => ({
  ...def,
  format: def.format === 'timestamp' ? formatTimestamp : undefined,
}))

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
