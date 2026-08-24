import type { Version } from '@/types/common'

/** Lifecycle dates of a version as label/value rows for the detail headers */
export function versionDates(v: Version | undefined): [string, string][] {
  if (!v) return []
  const rows: [string, string][] = []
  if (v.availableFrom) rows.push(['Available from', v.availableFrom])
  if (v.deprecatedFrom) rows.push(['Deprecated from', v.deprecatedFrom])
  if (v.terminatedFrom) rows.push(['Terminated from', v.terminatedFrom])
  return rows
}
