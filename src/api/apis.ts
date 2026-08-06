import { apiFetch } from './fetch'
import { API } from '@/constants/api'
import type { Api, ApiInstance, ApiType } from '@/types/api'
import type { Version } from '@/types/common'

const USE_MOCKS = import.meta.env.VITE_EMEL_DEV_USE_MOCKS === 'true'

interface InstanceListItem {
  instanceId: string
  displayName: string
  reference: string
}

interface ApiResponse {
  apiId?: string
  instanceId?: string
  displayName?: string
  description?: string
  version?: Version
  type?: ApiType
  system?: string
  annotations?: { key: string; value: string }[] | Record<string, string>
}

function decodeAnnotations(
  raw: { key: string; value: string }[] | Record<string, string> | undefined,
): Record<string, string> {
  if (!raw) return {}
  if (Array.isArray(raw)) return Object.fromEntries(raw.map((a) => [a.key, a.value]))
  return raw
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
    version: { version: res.version?.version ?? '', ...res.version },
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
  const resp = await apiFetch(API.APIS.list)
  if (!resp.ok) throw new Error(`Failed to load APIs: ${resp.status}`)
  const data: InstanceListItem[] = await resp.json()
  return data.map(apiFromList)
}

export async function fetchApiById(id: string): Promise<Api> {
  if (USE_MOCKS) {
    const { apis } = await import('@/mocks/api')
    const found = apis.find((a) => a.apiId === id)
    if (!found) throw new Error(`API ${id} not found in mocks`)
    return found
  }
  const resp = await apiFetch(API.APIS.byId(id))
  if (!resp.ok) throw new Error(`Failed to load API ${id}: ${resp.status}`)
  return decodeApi(await resp.json())
}

interface ApiInstanceResponse {
  apiInstanceId?: string
  instanceId?: string
  displayName?: string
  api?: string
  systemInstance?: string
  annotations?: { key: string; value: string }[] | Record<string, string>
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
  const resp = await apiFetch(API.API_INSTANCES.list)
  if (!resp.ok) throw new Error(`Failed to load API instances: ${resp.status}`)
  const data: InstanceListItem[] = await resp.json()
  return data.map(apiInstanceFromList)
}

export async function fetchApiInstanceById(id: string): Promise<ApiInstance> {
  if (USE_MOCKS) {
    const { apiInstances } = await import('@/mocks/api')
    const found = apiInstances.find((i) => i.apiInstanceId === id)
    if (!found) throw new Error(`API instance ${id} not found in mocks`)
    return found
  }
  const resp = await apiFetch(API.API_INSTANCES.byId(id))
  if (!resp.ok) throw new Error(`Failed to load API instance ${id}: ${resp.status}`)
  return decodeApiInstance(await resp.json())
}
