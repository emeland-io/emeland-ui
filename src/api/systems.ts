import { API } from '@/constants/api'
import type { System, SystemInstance } from '@/types/system'
import { decodeAnnotations, decodeVersion } from './decode'
import { MINIMAL_LIST_FIELDS, makeResourceApi, responseId } from './resource'
import type { System as SystemWire, SystemInstance as SystemInstanceWire } from './gen/types.gen'
import { zInstanceListItem, zSystem, zSystemInstance } from './gen/zod.gen'

function decodeSystem(res: SystemWire): System {
  return {
    systemId: responseId(res, 'systemId'),
    displayName: res.displayName ?? '',
    description: res.description ?? '',
    version: decodeVersion(res.version),
    abstract: res.abstract ?? false,
    parent: res.parent,
    annotations: decodeAnnotations(res.annotations),
  }
}

const systems = makeResourceApi<System, SystemWire>({
  name: 'System',
  namePlural: 'systems',
  listPath: API.SYSTEMS.list,
  byIdPath: API.SYSTEMS.byId,
  mocks: async () => (await import('@/mocks/systems')).systems,
  idKey: 'systemId',
  idOf: (s) => s.systemId,
  listSchema: zInstanceListItem,
  requireListFields: MINIMAL_LIST_FIELDS,
  responseSchema: zSystem,
  decode: decodeSystem,
})

export const fetchSystems = systems.fetchAll
export const fetchSystemById = systems.fetchById

function decodeSystemInstance(res: SystemInstanceWire): SystemInstance {
  return {
    systemInstanceId: responseId(res, 'systemInstanceId'),
    displayName: res.displayName ?? '',
    system: res.system ?? '',
    context: res.context,
    annotations: decodeAnnotations(res.annotations),
  }
}

const systemInstances = makeResourceApi<SystemInstance, SystemInstanceWire>({
  name: 'System instance',
  namePlural: 'system instances',
  listPath: API.SYSTEM_INSTANCES.list,
  byIdPath: API.SYSTEM_INSTANCES.byId,
  mocks: async () => (await import('@/mocks/systems')).systemInstances,
  idKey: 'systemInstanceId',
  idOf: (i) => i.systemInstanceId,
  listSchema: zInstanceListItem,
  requireListFields: MINIMAL_LIST_FIELDS,
  responseSchema: zSystemInstance,
  decode: decodeSystemInstance,
})

export const fetchSystemInstances = systemInstances.fetchAll
export const fetchSystemInstanceById = systemInstances.fetchById
