import { API } from '@/constants/api'
import type { Finding, FindingResource, FindingType } from '@/types/finding'
import { USE_MOCKS, getJson } from './fetch'
import { decodeAnnotations, type AnnotationsResponse } from './decode'

interface FindingResponse {
  findingId: string
  displayName: string
  description?: string
  findingType?: { findingTypeId: string; displayName: string }
  resources?: ResourceResponse[]
  resource?: ResourceResponse
  reference?: string
  annotations?: AnnotationsResponse
}

interface ResourceResponse {
  id: string
  displayName?: string
  resourceType: string
}

// Unlike the other resources, the finding-type list endpoint keys by findingTypeId
interface FindingTypeListItem {
  findingTypeId: string
  displayName: string
  reference: string
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
    findingId: res.findingId,
    displayName: res.displayName ?? '',
    description: res.description ?? '',
    findingType: res.findingType
      ? { findingTypeId: res.findingType.findingTypeId, displayName: res.findingType.displayName }
      : undefined,
    resources: decodeResources(res),
    reference: res.reference,
    annotations: decodeAnnotations(res.annotations),
  }
}

function decodeFindingType(res: Record<string, unknown>): FindingType {
  return {
    findingTypeId: (res.findingTypeId as string) ?? (res.instanceId as string) ?? '',
    displayName: (res.displayName as string) ?? '',
    description: (res.description as string) ?? '',
    annotations: decodeAnnotations(res.annotations as AnnotationsResponse | undefined),
  }
}

function findingTypeFromList(item: FindingTypeListItem): FindingType {
  return {
    findingTypeId: item.findingTypeId,
    displayName: item.displayName,
    annotations: {},
  }
}

export async function fetchFindings(): Promise<Finding[]> {
  if (USE_MOCKS) {
    const { findings } = await import('@/mocks/findings')
    return findings
  }
  const data = await getJson<FindingResponse[]>(API.FINDINGS.list, 'findings')
  return data.map(decodeFinding)
}

export async function fetchFindingById(id: string): Promise<Finding> {
  if (USE_MOCKS) {
    const { findings } = await import('@/mocks/findings')
    const found = findings.find((f) => f.findingId === id)
    if (!found) throw new Error(`Finding ${id} not found in mocks`)
    return found
  }
  return decodeFinding(await getJson<FindingResponse>(API.FINDINGS.byId(id), `finding ${id}`))
}

export async function fetchFindingTypes(): Promise<FindingType[]> {
  if (USE_MOCKS) {
    const { findingTypes } = await import('@/mocks/findings')
    return findingTypes
  }
  const data = await getJson<FindingTypeListItem[]>(API.FINDING_TYPES.list, 'finding types')
  return data.map(findingTypeFromList)
}

export async function fetchFindingTypeById(id: string): Promise<FindingType> {
  if (USE_MOCKS) {
    const { findingTypes } = await import('@/mocks/findings')
    const found = findingTypes.find((t) => t.findingTypeId === id)
    if (!found) throw new Error(`Finding type ${id} not found in mocks`)
    return found
  }
  return decodeFindingType(
    await getJson<Record<string, unknown>>(API.FINDING_TYPES.byId(id), `finding type ${id}`),
  )
}
