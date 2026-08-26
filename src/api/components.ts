import { API } from '@/constants/api'
import type { Component, ComponentInstance } from '@/types/component'
import { decodeAnnotations, decodeVersion } from './decode'
import { MINIMAL_LIST_FIELDS, makeResourceApi, responseId } from './resource'
import type {
  Component as ComponentWire,
  ComponentInstance as ComponentInstanceWire,
} from './gen/types.gen'
import { zComponent, zComponentInstance, zInstanceListItem } from './gen/zod.gen'

function decodeComponent(res: ComponentWire): Component {
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

const components = makeResourceApi<Component, ComponentWire>({
  name: 'Component',
  namePlural: 'components',
  listPath: API.COMPONENTS.list,
  byIdPath: API.COMPONENTS.byId,
  mocks: async () => (await import('@/mocks/components')).components,
  idKey: 'componentId',
  idOf: (c) => c.componentId,
  listSchema: zInstanceListItem,
  requireListFields: MINIMAL_LIST_FIELDS,
  responseSchema: zComponent,
  decode: decodeComponent,
})

export const fetchComponents = components.fetchAll
export const fetchComponentById = components.fetchById

function decodeComponentInstance(res: ComponentInstanceWire): ComponentInstance {
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

const componentInstances = makeResourceApi<ComponentInstance, ComponentInstanceWire>({
  name: 'Component instance',
  namePlural: 'component instances',
  listPath: API.COMPONENT_INSTANCES.list,
  byIdPath: API.COMPONENT_INSTANCES.byId,
  mocks: async () => (await import('@/mocks/components')).componentInstances,
  idKey: 'componentInstanceId',
  idOf: (i) => i.componentInstanceId,
  listSchema: zInstanceListItem,
  requireListFields: MINIMAL_LIST_FIELDS,
  responseSchema: zComponentInstance,
  decode: decodeComponentInstance,
})

export const fetchComponentInstances = componentInstances.fetchAll
export const fetchComponentInstanceById = componentInstances.fetchById
