import { apiFetch } from './fetch'
import type { Finding, FindingType } from '@/types'

const USE_MOCKS = import.meta.env.VITE_EMEL_DEV_USE_MOCKS === 'true'

export async function fetchFindings(): Promise<Finding[]> {
  if (USE_MOCKS) {
    const { findings } = await import('@/mocks/findings')
    return findings
  }
  const resp = await apiFetch('/api/findings')
  if (!resp.ok) throw new Error(`Failed to load findings: ${resp.status}`)
  return resp.json()
}

export async function fetchFindingTypes(): Promise<FindingType[]> {
  if (USE_MOCKS) {
    const { findingTypes } = await import('@/mocks/findings')
    return findingTypes
  }
  const resp = await apiFetch('/api/findingTypes')
  if (!resp.ok) throw new Error(`Failed to load finding types: ${resp.status}`)
  return resp.json()
}
