import type { CapabilityLifecycle } from '@/utils/version'

/** Display order of capability lifecycles, best state first */
export const LIFECYCLE_ORDER: readonly CapabilityLifecycle[] = [
  'available',
  'upcoming',
  'deprecated',
  'terminated',
  'no versions',
]

/** Label and tag tone per lifecycle, shared by the cards grid and the table */
export const LIFECYCLE_TAG: Record<
  CapabilityLifecycle,
  { label: string; tone: 'accent' | 'muted' | 'warning' | 'error' }
> = {
  available: { label: 'Available', tone: 'accent' },
  upcoming: { label: 'Upcoming', tone: 'muted' },
  deprecated: { label: 'Deprecated', tone: 'warning' },
  terminated: { label: 'Terminated', tone: 'error' },
  'no versions': { label: 'No versions', tone: 'muted' },
}
