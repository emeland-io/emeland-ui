import type { Version } from '@/types/common'
import type { CapabilityVersionRef } from '@/types/capability'

/** Lifecycle dates of a version as label/value rows for the detail headers */
export function versionDates(v: Version | undefined): [string, string][] {
  if (!v) return []
  const rows: [string, string][] = []
  if (v.availableFrom) rows.push(['Available from', v.availableFrom])
  if (v.deprecatedFrom) rows.push(['Deprecated from', v.deprecatedFrom])
  if (v.terminatedFrom) rows.push(['Terminated from', v.terminatedFrom])
  return rows
}

/** Lifecycle state of a version at a point in time */
export type VersionStatus = 'upcoming' | 'available' | 'deprecated' | 'terminated'

export function versionStatus(v: Version, now: Date = new Date()): VersionStatus {
  const t = now.getTime()
  const passed = (iso?: string) => iso !== undefined && Date.parse(iso) <= t
  if (passed(v.terminatedFrom)) return 'terminated'
  if (passed(v.deprecatedFrom)) return 'deprecated'
  if (v.availableFrom && !passed(v.availableFrom)) return 'upcoming'
  return 'available'
}

/** The version ref with the highest version string (numeric-aware compare) */
export function latestVersionRef(
  refs: CapabilityVersionRef[] | undefined,
): CapabilityVersionRef | undefined {
  if (!refs?.length) return undefined
  return refs.reduce((best, r) =>
    (r.version?.version ?? '').localeCompare(best.version?.version ?? '', undefined, {
      numeric: true,
    }) > 0
      ? r
      : best,
  )
}

export type CapabilityLifecycle = VersionStatus | 'no versions'

const LIFECYCLE_RANK: VersionStatus[] = ['available', 'upcoming', 'deprecated', 'terminated']

export function capabilityLifecycle(
  refs: CapabilityVersionRef[] | undefined,
  now?: Date,
): CapabilityLifecycle {
  const statuses = (refs ?? []).filter((r) => r.version).map((r) => versionStatus(r.version!, now))
  if (statuses.length === 0) return 'no versions'
  return LIFECYCLE_RANK.find((s) => statuses.includes(s)) ?? 'terminated'
}
