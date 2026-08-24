import { API } from '@/constants/api'
import type { Api, ApiInstance, ApiType } from '@/types/api'
import type { Version } from '@/types/common'
import { decodeAnnotations, decodeVersion, type AnnotationsResponse } from './decode'
import { makeResourceApi, responseId } from './resource'

interface ApiResponse {
  apiId?: string
  instanceId?: string
  displayName?: string
  description?: string
  version?: Version
  type?: ApiType
  system?: string
  annotations?: AnnotationsResponse
}

function decodeApi(res: ApiResponse): Api {
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

const apis = makeResourceApi<Api, ApiResponse>({
  name: 'API',
  namePlural: 'APIs',
  listPath: API.APIS.list,
  byIdPath: API.APIS.byId,
  mocks: async () => (await import('@/mocks/api')).apis,
  idOf: (a) => a.apiId,
  decode: decodeApi,
})

export const fetchApis = apis.fetchAll
export const fetchApiById = apis.fetchById

interface ApiInstanceResponse {
  apiInstanceId?: string
  instanceId?: string
  displayName?: string
  api?: string
  systemInstance?: string
  annotations?: AnnotationsResponse
}

function decodeApiInstance(res: ApiInstanceResponse): ApiInstance {
  return {
    apiInstanceId: responseId(res, 'apiInstanceId'),
    displayName: res.displayName ?? '',
    ...(res.api ? { api: res.api } : {}),
    ...(res.systemInstance ? { systemInstance: res.systemInstance } : {}),
    annotations: decodeAnnotations(res.annotations),
  }
}

const apiInstances = makeResourceApi<ApiInstance, ApiInstanceResponse>({
  name: 'API instance',
  namePlural: 'API instances',
  listPath: API.API_INSTANCES.list,
  byIdPath: API.API_INSTANCES.byId,
  mocks: async () => (await import('@/mocks/api')).apiInstances,
  idOf: (i) => i.apiInstanceId,
  decode: decodeApiInstance,
})

export const fetchApiInstances = apiInstances.fetchAll
export const fetchApiInstanceById = apiInstances.fetchById
