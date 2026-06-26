import { apiFetch } from './fetch'
import { API } from '@/constants/api'
import type { Finding, FindingResource, FindingType } from '@/types/finding'

const USE_MOCKS = import.meta.env.VITE_EMEL_DEV_USE_MOCKS === 'true'

interface FindingResponse {
  id: string
  displayName: string
  description?: string
  findingType?: { id: string; displayName: string }
  resources?: ResourceResponse[]
  resource?: ResourceResponse
  reference?: string
  annotations?: { key: string; value: string }[] | Record<string, string>
}

interface ResourceResponse {
  id: string
  displayName?: string
  resourceType: string
}

function decodeAnnotations(
  raw: { key: string; value: string }[] | Record<string, string> | undefined,
): Record<string, string> {
  if (!raw) return {}
  if (Array.isArray(raw)) return Object.fromEntries(raw.map((a) => [a.key, a.value]))
  return raw
}

function decodeResources(res: FindingResponse): FindingResource[] {
  const list = res.resources ?? (res.resource ? [res.resource] : [])
  return list.map((r) => ({
    resourceId: r.id,
    displayName: r.displayName ?? '',
    resourceType: r.resourceType as FindingResource['resourceType'],
  }))
}

function decodeFinding(res: FindingResponse): Finding {
  return {
    findingId: res.id,
    displayName: res.displayName ?? '',
    description: res.description ?? '',
    findingType: res.findingType
      ? { findingTypeId: res.findingType.id, displayName: res.findingType.displayName }
      : undefined,
    resources: decodeResources(res),
    reference: res.reference,
    annotations: decodeAnnotations(res.annotations),
  }
}

function decodeFindingType(res: Record<string, unknown>): FindingType {
  return {
    findingTypeId: res.id as string,
    displayName: (res.displayName as string) ?? '',
    description: (res.description as string) ?? '',
    annotations: decodeAnnotations(res.annotations as { key: string; value: string }[] | undefined),
  }
}

export async function fetchFindings(): Promise<Finding[]> {
  if (USE_MOCKS) {
    const { findings } = await import('@/mocks/findings')
    return findings
  }
  const resp = await apiFetch(API.FINDINGS.list)
  if (!resp.ok) throw new Error(`Failed to load findings: ${resp.status}`)
  const data: FindingResponse[] = await resp.json()
  return data.map(decodeFinding)
}

export async function fetchFindingById(id: string): Promise<Finding> {
  if (USE_MOCKS) {
    const { findings } = await import('@/mocks/findings')
    const found = findings.find((f) => f.findingId === id)
    if (!found) throw new Error(`Finding ${id} not found in mocks`)
    return found
  }
  const resp = await apiFetch(API.FINDINGS.byId(id))
  if (!resp.ok) throw new Error(`Failed to load finding ${id}: ${resp.status}`)
  return decodeFinding(await resp.json())
}

export async function fetchFindingTypes(): Promise<FindingType[]> {
  if (USE_MOCKS) {
    const { findingTypes } = await import('@/mocks/findings')
    return findingTypes
  }
  const resp = await apiFetch(API.FINDING_TYPES.list)
  if (!resp.ok) throw new Error(`Failed to load finding types: ${resp.status}`)
  const data: Record<string, unknown>[] = await resp.json()
  return data.map(decodeFindingType)
}

export async function fetchFindingTypeById(id: string): Promise<FindingType> {
  if (USE_MOCKS) {
    const { findingTypes } = await import('@/mocks/findings')
    const found = findingTypes.find((t) => t.findingTypeId === id)
    if (!found) throw new Error(`Finding type ${id} not found in mocks`)
    return found
  }
  const resp = await apiFetch(API.FINDING_TYPES.byId(id))
  if (!resp.ok) throw new Error(`Failed to load finding type ${id}: ${resp.status}`)
  return decodeFindingType(await resp.json())
}
