import { API } from '@/constants/api'
import type { Finding, FindingResource, FindingType } from '@/types/finding'
import { decodeAnnotations, type AnnotationsResponse } from './decode'
import { decodeTypeEntity, makeResourceApi } from './resource'

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

// the finding list endpoint returns full findings, not minimal list items
const findings = makeResourceApi<Finding, FindingResponse, FindingResponse>({
  name: 'Finding',
  namePlural: 'findings',
  listPath: API.FINDINGS.list,
  byIdPath: API.FINDINGS.byId,
  mocks: async () => (await import('@/mocks/findings')).findings,
  idOf: (f) => f.findingId,
  fromList: decodeFinding,
  decode: decodeFinding,
})

export const fetchFindings = findings.fetchAll
export const fetchFindingById = findings.fetchById

const findingTypes = makeResourceApi<FindingType, Record<string, unknown>, FindingTypeListItem>({
  name: 'Finding type',
  namePlural: 'finding types',
  listPath: API.FINDING_TYPES.list,
  byIdPath: API.FINDING_TYPES.byId,
  mocks: async () => (await import('@/mocks/findings')).findingTypes,
  idOf: (t) => t.findingTypeId,
  fromList: (item) =>
    decodeTypeEntity('findingTypeId', {
      findingTypeId: item.findingTypeId,
      displayName: item.displayName,
    }),
  decode: (res) => decodeTypeEntity('findingTypeId', res),
})

export const fetchFindingTypes = findingTypes.fetchAll
export const fetchFindingTypeById = findingTypes.fetchById
