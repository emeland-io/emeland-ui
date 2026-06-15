import type { Annotations } from '@/types/common'

export const Annotation = {
  FINDING_KIND: 'finding-kind',
  DETECTED_AT: 'detected-at',
} as const

export type AnnotationKey = (typeof Annotation)[keyof typeof Annotation]

export function getAnnotation(annotations: Annotations, key: AnnotationKey): string | undefined {
  const direct = annotations[key]
  if (direct !== undefined) return direct
  const entry = Object.entries(annotations).find(([k]) => k.endsWith(`/${key}`))
  return entry?.[1]
}
