import { apiFetch } from './fetch'
import { API } from '@/constants/api'
import type { Component } from '@/types/component'
import type { Version } from '@/types/common'

const USE_MOCKS = import.meta.env.VITE_EMEL_DEV_USE_MOCKS === 'true'

interface InstanceListItem {
  instanceId: string
  displayName: string
  reference: string
}

interface ComponentResponse {
  componentId?: string
  instanceId?: string
  displayName?: string
  description?: string
  version?: Version
  system?: string
  consumes?: string[]
  provides?: string[]
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

function decodeComponent(res: ComponentResponse): Component {
  return {
    componentId: res.componentId ?? res.instanceId ?? '',
    displayName: res.displayName ?? '',
    description: res.description ?? '',
    version: decodeVersion(res.version),
    system: res.system ?? '',
    consumes: res.consumes ?? [],
    provides: res.provides ?? [],
    annotations: decodeAnnotations(res.annotations),
  }
}

function componentFromList(item: InstanceListItem): Component {
  return {
    componentId: item.instanceId,
    displayName: item.displayName,
    version: { version: '' },
    system: '',
    consumes: [],
    provides: [],
    annotations: {},
  }
}

export async function fetchComponents(): Promise<Component[]> {
  if (USE_MOCKS) {
    const { components } = await import('@/mocks/components')
    return components
  }
  const resp = await apiFetch(API.COMPONENTS.list)
  if (!resp.ok) throw new Error(`Failed to load components: ${resp.status}`)
  const data: InstanceListItem[] = await resp.json()
  return data.map(componentFromList)
}

export async function fetchComponentById(id: string): Promise<Component> {
  if (USE_MOCKS) {
    const { components } = await import('@/mocks/components')
    const found = components.find((c) => c.componentId === id)
    if (!found) throw new Error(`Component ${id} not found in mocks`)
    return found
  }
  const resp = await apiFetch(API.COMPONENTS.byId(id))
  if (!resp.ok) throw new Error(`Failed to load component ${id}: ${resp.status}`)
  return decodeComponent(await resp.json())
}
