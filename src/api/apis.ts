import { apiFetch } from './fetch'
import { API } from '@/constants/api'
import type { Api, ApiType } from '@/types/api'
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
