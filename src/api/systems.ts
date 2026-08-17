import { API } from '@/constants/api'
import type { System, SystemInstance } from '@/types/system'
import type { Version } from '@/types/common'
import { USE_MOCKS, getJson } from './fetch'
import {
  decodeAnnotations,
  decodeVersion,
  type InstanceListItem,
  type AnnotationsResponse,
} from './decode'

interface SystemResponse {
  systemId?: string
  instanceId?: string
  displayName?: string
  description?: string
  version?: Version
  abstract?: boolean
  parent?: string
  annotations?: AnnotationsResponse
}

interface SystemInstanceResponse {
  systemInstanceId?: string
  instanceId?: string
  displayName?: string
  system?: string
  context?: string
  annotations?: AnnotationsResponse
}

function decodeSystem(res: SystemResponse): System {
  return {
    systemId: res.systemId ?? res.instanceId ?? '',
    displayName: res.displayName ?? '',
    description: res.description ?? '',
    version: decodeVersion(res.version),
    abstract: res.abstract ?? false,
    parent: res.parent,
    annotations: decodeAnnotations(res.annotations),
  }
}

function systemFromList(item: InstanceListItem): System {
  return {
    systemId: item.instanceId,
    displayName: item.displayName,
    version: { version: '' },
    abstract: false,
    annotations: {},
  }
}

function decodeSystemInstance(res: SystemInstanceResponse): SystemInstance {
  return {
    systemInstanceId: res.systemInstanceId ?? res.instanceId ?? '',
    displayName: res.displayName ?? '',
    system: res.system ?? '',
    context: res.context,
    annotations: decodeAnnotations(res.annotations),
  }
}

function systemInstanceFromList(item: InstanceListItem): SystemInstance {
  return {
    systemInstanceId: item.instanceId,
    displayName: item.displayName,
    system: '',
    annotations: {},
  }
}

export async function fetchSystems(): Promise<System[]> {
  if (USE_MOCKS) {
    const { systems } = await import('@/mocks/systems')
    return systems
  }
  const data = await getJson<InstanceListItem[]>(API.SYSTEMS.list, 'systems')
  return data.map(systemFromList)
}

export async function fetchSystemById(id: string): Promise<System> {
  if (USE_MOCKS) {
    const { systems } = await import('@/mocks/systems')
    const found = systems.find((s) => s.systemId === id)
    if (!found) throw new Error(`System ${id} not found in mocks`)
    return found
  }
  return decodeSystem(await getJson<SystemResponse>(API.SYSTEMS.byId(id), `system ${id}`))
}

export async function fetchSystemInstances(): Promise<SystemInstance[]> {
  if (USE_MOCKS) {
    const { systemInstances } = await import('@/mocks/systems')
    return systemInstances
  }
  const data = await getJson<InstanceListItem[]>(API.SYSTEM_INSTANCES.list, 'system instances')
  return data.map(systemInstanceFromList)
}

export async function fetchSystemInstanceById(id: string): Promise<SystemInstance> {
  if (USE_MOCKS) {
    const { systemInstances } = await import('@/mocks/systems')
    const found = systemInstances.find((i) => i.systemInstanceId === id)
    if (!found) throw new Error(`System instance ${id} not found in mocks`)
    return found
  }
  return decodeSystemInstance(
    await getJson<SystemInstanceResponse>(API.SYSTEM_INSTANCES.byId(id), `system instance ${id}`),
  )
}
