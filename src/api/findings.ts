import { API } from '@/constants/api'
import type { Finding, FindingResource, FindingType } from '@/types/finding'
import { decodeAnnotations } from './decode'
import { decodeTypeEntity, makeResourceApi } from './resource'
import type {
  FindingView as FindingWire,
  FindingType as FindingTypeWire,
  ResourceView as ResourceWire,
} from './gen/types.gen'
import { zFindingType, zFindingView } from './gen/zod.gen'

function decodeResources(res: FindingWire): FindingResource[] {
  const list = res.resources ?? []
  return list.map((r: ResourceWire) => ({
    resourceId: r.id,
    displayName: r.displayName ?? '',
    resourceType: r.resourceType as FindingResource['resourceType'],
  }))
}

function decodeFinding(res: FindingWire): Finding {
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

// the finding list endpoint returns full finding views, not minimal list items
const findings = makeResourceApi<Finding, FindingWire, FindingWire>({
  name: 'Finding',
  namePlural: 'findings',
  listPath: API.FINDINGS.list,
  byIdPath: API.FINDINGS.byId,
  mocks: async () => (await import('@/mocks/findings')).findings,
  idKey: 'findingId',
  idOf: (f) => f.findingId,
  listSchema: zFindingView,
  fromList: decodeFinding,
  responseSchema: zFindingView,
  decode: decodeFinding,
})

export const fetchFindings = findings.fetchAll
export const fetchFindingById = findings.fetchById

// the finding-type list returns full types (minimal payloads also pass:
// the schema requires only findingTypeId + displayName)
const findingTypes = makeResourceApi<FindingType, FindingTypeWire>({
  name: 'Finding type',
  namePlural: 'finding types',
  listPath: API.FINDING_TYPES.list,
  byIdPath: API.FINDING_TYPES.byId,
  mocks: async () => (await import('@/mocks/findings')).findingTypes,
  idKey: 'findingTypeId',
  idOf: (t) => t.findingTypeId,
  listSchema: zFindingType,
  requireListFields: ['findingTypeId', 'displayName'],
  responseSchema: zFindingType,
  fromList: (item) => decodeTypeEntity('findingTypeId', item),
  decode: (res) => decodeTypeEntity('findingTypeId', res),
})

export const fetchFindingTypes = findingTypes.fetchAll
export const fetchFindingTypeById = findingTypes.fetchById
