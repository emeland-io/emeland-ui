import { API } from '@/constants/api'
import type { Component, ComponentInstance } from '@/types/component'
import type { Version } from '@/types/common'
import { decodeAnnotations, decodeVersion, type AnnotationsResponse } from './decode'
import { makeResourceApi, responseId } from './resource'

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
    componentId: responseId(res, 'componentId'),
    displayName: res.displayName ?? '',
    description: res.description ?? '',
    version: decodeVersion(res.version),
    system: res.system ?? '',
    consumes: res.consumes ?? [],
    provides: res.provides ?? [],
    annotations: decodeAnnotations(res.annotations),
  }
}

const components = makeResourceApi<Component, ComponentResponse>({
  name: 'Component',
  namePlural: 'components',
  listPath: API.COMPONENTS.list,
  byIdPath: API.COMPONENTS.byId,
  mocks: async () => (await import('@/mocks/components')).components,
  idOf: (c) => c.componentId,
  decode: decodeComponent,
})

export const fetchComponents = components.fetchAll
export const fetchComponentById = components.fetchById

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
    componentInstanceId: responseId(res, 'componentInstanceId'),
    displayName: res.displayName ?? '',
    component: res.component ?? '',
    systemInstance: res.systemInstance ?? '',
    consumes: res.consumes ?? [],
    provides: res.provides ?? [],
    annotations: decodeAnnotations(res.annotations),
  }
}

const componentInstances = makeResourceApi<ComponentInstance, ComponentInstanceResponse>({
  name: 'Component instance',
  namePlural: 'component instances',
  listPath: API.COMPONENT_INSTANCES.list,
  byIdPath: API.COMPONENT_INSTANCES.byId,
  mocks: async () => (await import('@/mocks/components')).componentInstances,
  idOf: (i) => i.componentInstanceId,
  decode: decodeComponentInstance,
})

export const fetchComponentInstances = componentInstances.fetchAll
export const fetchComponentInstanceById = componentInstances.fetchById
