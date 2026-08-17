import { API } from '@/constants/api'
import type { Api, ApiInstance, ApiType } from '@/types/api'
import type { Version } from '@/types/common'
import { USE_MOCKS, getJson } from './fetch'
import {
  decodeAnnotations,
  decodeVersion,
  type InstanceListItem,
  type AnnotationsResponse,
} from './decode'

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

function apiFromList(item: InstanceListItem): Api {
  return {
    apiId: item.instanceId,
    displayName: item.displayName,
    version: { version: '' },
    type: 'Unknown',
    system: '',
    annotations: {},
  }
}

function decodeApi(res: ApiResponse): Api {
  return {
    apiId: res.apiId ?? res.instanceId ?? '',
    displayName: res.displayName ?? '',
    description: res.description ?? '',
    version: decodeVersion(res.version),
    type: res.type ?? 'Unknown',
    system: res.system ?? '',
    annotations: decodeAnnotations(res.annotations),
  }
}

export async function fetchApis(): Promise<Api[]> {
  if (USE_MOCKS) {
    const { apis } = await import('@/mocks/api')
    return apis
  }
  const data = await getJson<InstanceListItem[]>(API.APIS.list, 'APIs')
  return data.map(apiFromList)
}

export async function fetchApiById(id: string): Promise<Api> {
  if (USE_MOCKS) {
    const { apis } = await import('@/mocks/api')
    const found = apis.find((a) => a.apiId === id)
    if (!found) throw new Error(`API ${id} not found in mocks`)
    return found
  }
  return decodeApi(await getJson<ApiResponse>(API.APIS.byId(id), `API ${id}`))
}

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
    apiInstanceId: res.apiInstanceId ?? res.instanceId ?? '',
    displayName: res.displayName ?? '',
    ...(res.api ? { api: res.api } : {}),
    ...(res.systemInstance ? { systemInstance: res.systemInstance } : {}),
    annotations: decodeAnnotations(res.annotations),
  }
}

function apiInstanceFromList(item: InstanceListItem): ApiInstance {
  return {
    apiInstanceId: item.instanceId,
    displayName: item.displayName,
    annotations: {},
  }
}

export async function fetchApiInstances(): Promise<ApiInstance[]> {
  if (USE_MOCKS) {
    const { apiInstances } = await import('@/mocks/api')
    return apiInstances
  }
  const data = await getJson<InstanceListItem[]>(API.API_INSTANCES.list, 'API instances')
  return data.map(apiInstanceFromList)
}

export async function fetchApiInstanceById(id: string): Promise<ApiInstance> {
  if (USE_MOCKS) {
    const { apiInstances } = await import('@/mocks/api')
    const found = apiInstances.find((i) => i.apiInstanceId === id)
    if (!found) throw new Error(`API instance ${id} not found in mocks`)
    return found
  }
  return decodeApiInstance(
    await getJson<ApiInstanceResponse>(API.API_INSTANCES.byId(id), `API instance ${id}`),
  )
}
