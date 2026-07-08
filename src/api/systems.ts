import { apiFetch } from './fetch'
import { API } from '@/constants/api'
import type { System, SystemInstance } from '@/types/system'
import type { Version } from '@/types/common'

const USE_MOCKS = import.meta.env.VITE_EMEL_DEV_USE_MOCKS === 'true'

interface InstanceListItem {
  instanceId: string
  displayName: string
  reference: string
}

interface SystemResponse {
  systemId?: string
  instanceId?: string
  displayName?: string
  description?: string
  version?: Version
  abstract?: boolean
  parent?: string
  annotations?: { key: string; value: string }[] | Record<string, string>
}

interface SystemInstanceResponse {
  systemInstanceId?: string
  instanceId?: string
  displayName?: string
  system?: string
  context?: string
  annotations?: { key: string; value: string }[] | Record<string, string>
}

function decodeAnnotations(
  raw: { key: string; value: string }[] | Record<string, string> | undefined,
): Record<string, string> {
  if (!raw) return {}
  if (Array.isArray(raw)) return Object.fromEntries(raw.map((a) => [a.key, a.value]))
  return raw
}

function decodeVersion(v: Version | undefined): Version {
  return { version: v?.version ?? '', ...v }
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
  const resp = await apiFetch(API.SYSTEMS.list)
  if (!resp.ok) throw new Error(`Failed to load systems: ${resp.status}`)
  const data: InstanceListItem[] = await resp.json()
  return data.map(systemFromList)
}

export async function fetchSystemById(id: string): Promise<System> {
  if (USE_MOCKS) {
    const { systems } = await import('@/mocks/systems')
    const found = systems.find((s) => s.systemId === id)
    if (!found) throw new Error(`System ${id} not found in mocks`)
    return found
  }
  const resp = await apiFetch(API.SYSTEMS.byId(id))
  if (!resp.ok) throw new Error(`Failed to load system ${id}: ${resp.status}`)
  return decodeSystem(await resp.json())
}

export async function fetchSystemInstances(): Promise<SystemInstance[]> {
  if (USE_MOCKS) {
    const { systemInstances } = await import('@/mocks/systems')
    return systemInstances
  }
  const resp = await apiFetch(API.SYSTEM_INSTANCES.list)
  if (!resp.ok) throw new Error(`Failed to load system instances: ${resp.status}`)
  const data: InstanceListItem[] = await resp.json()
  return data.map(systemInstanceFromList)
}

export async function fetchSystemInstanceById(id: string): Promise<SystemInstance> {
  if (USE_MOCKS) {
    const { systemInstances } = await import('@/mocks/systems')
    const found = systemInstances.find((i) => i.systemInstanceId === id)
    if (!found) throw new Error(`System instance ${id} not found in mocks`)
    return found
  }
  const resp = await apiFetch(API.SYSTEM_INSTANCES.byId(id))
  if (!resp.ok) throw new Error(`Failed to load system instance ${id}: ${resp.status}`)
  return decodeSystemInstance(await resp.json())
}
