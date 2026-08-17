import { API } from '@/constants/api'
import type { Component, ComponentInstance } from '@/types/component'
import type { Version } from '@/types/common'
import { USE_MOCKS, getJson } from './fetch'
import {
  decodeAnnotations,
  decodeVersion,
  type InstanceListItem,
  type AnnotationsResponse,
} from './decode'

interface ComponentResponse {
  componentId?: string
  instanceId?: string
  displayName?: string
  description?: string
  version?: Version
  system?: string
  consumes?: string[]
  provides?: string[]
  annotations?: AnnotationsResponse
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
  const data = await getJson<InstanceListItem[]>(API.COMPONENTS.list, 'components')
  return data.map(componentFromList)
}

export async function fetchComponentById(id: string): Promise<Component> {
  if (USE_MOCKS) {
    const { components } = await import('@/mocks/components')
    const found = components.find((c) => c.componentId === id)
    if (!found) throw new Error(`Component ${id} not found in mocks`)
    return found
  }
  return decodeComponent(
    await getJson<ComponentResponse>(API.COMPONENTS.byId(id), `component ${id}`),
  )
}

interface ComponentInstanceResponse {
  componentInstanceId?: string
  instanceId?: string
  displayName?: string
  component?: string
  systemInstance?: string
  consumes?: string[]
  provides?: string[]
  annotations?: AnnotationsResponse
}

function decodeComponentInstance(res: ComponentInstanceResponse): ComponentInstance {
  return {
    componentInstanceId: res.componentInstanceId ?? res.instanceId ?? '',
    displayName: res.displayName ?? '',
    component: res.component ?? '',
    systemInstance: res.systemInstance ?? '',
    consumes: res.consumes ?? [],
    provides: res.provides ?? [],
    annotations: decodeAnnotations(res.annotations),
  }
}

function componentInstanceFromList(item: InstanceListItem): ComponentInstance {
  return {
    componentInstanceId: item.instanceId,
    displayName: item.displayName,
    component: '',
    systemInstance: '',
    consumes: [],
    provides: [],
    annotations: {},
  }
}

export async function fetchComponentInstances(): Promise<ComponentInstance[]> {
  if (USE_MOCKS) {
    const { componentInstances } = await import('@/mocks/components')
    return componentInstances
  }
  const data = await getJson<InstanceListItem[]>(
    API.COMPONENT_INSTANCES.list,
    'component instances',
  )
  return data.map(componentInstanceFromList)
}

export async function fetchComponentInstanceById(id: string): Promise<ComponentInstance> {
  if (USE_MOCKS) {
    const { componentInstances } = await import('@/mocks/components')
    const found = componentInstances.find((c) => c.componentInstanceId === id)
    if (!found) throw new Error(`Component instance ${id} not found in mocks`)
    return found
  }
  return decodeComponentInstance(
    await getJson<ComponentInstanceResponse>(
      API.COMPONENT_INSTANCES.byId(id),
      `component instance ${id}`,
    ),
  )
}
