import { API } from '@/constants/api'
import type { Api, ApiInstance } from '@/types/api'
import { decodeAnnotations, decodeVersion } from './decode'
import { MINIMAL_LIST_FIELDS, makeResourceApi, responseId } from './resource'
import type { Api as ApiWire, ApiInstance as ApiInstanceWire } from './gen/types.gen'
import { zApi, zApiInstance, zInstanceListItem } from './gen/zod.gen'

function decodeApi(res: ApiWire): Api {
  return {
    apiId: responseId(res, 'apiId'),
    displayName: res.displayName ?? '',
    description: res.description ?? '',
    version: decodeVersion(res.version),
    type: res.type ?? 'Unknown',
    system: res.system ?? '',
    annotations: decodeAnnotations(res.annotations),
  }
}

const apis = makeResourceApi<Api, ApiWire>({
  name: 'API',
  namePlural: 'APIs',
  listPath: API.APIS.list,
  byIdPath: API.APIS.byId,
  mocks: async () => (await import('@/mocks/api')).apis,
  idKey: 'apiId',
  idOf: (a) => a.apiId,
  listSchema: zInstanceListItem,
  requireListFields: MINIMAL_LIST_FIELDS,
  responseSchema: zApi,
  decode: decodeApi,
})

export const fetchApis = apis.fetchAll
export const fetchApiById = apis.fetchById

function decodeApiInstance(res: ApiInstanceWire): ApiInstance {
  return {
    apiInstanceId: responseId(res, 'apiInstanceId'),
    displayName: res.displayName ?? '',
    ...(res.api ? { api: res.api } : {}),
    ...(res.systemInstance ? { systemInstance: res.systemInstance } : {}),
    annotations: decodeAnnotations(res.annotations),
  }
}

const apiInstances = makeResourceApi<ApiInstance, ApiInstanceWire>({
  name: 'API instance',
  namePlural: 'API instances',
  listPath: API.API_INSTANCES.list,
  byIdPath: API.API_INSTANCES.byId,
  mocks: async () => (await import('@/mocks/api')).apiInstances,
  idKey: 'apiInstanceId',
  idOf: (i) => i.apiInstanceId,
  listSchema: zInstanceListItem,
  requireListFields: MINIMAL_LIST_FIELDS,
  responseSchema: zApiInstance,
  decode: decodeApiInstance,
})

export const fetchApiInstances = apiInstances.fetchAll
export const fetchApiInstanceById = apiInstances.fetchById
