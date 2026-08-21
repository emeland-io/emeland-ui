import { API } from '@/constants/api'
import type { System, SystemInstance } from '@/types/system'
import type { Version } from '@/types/common'
import { decodeAnnotations, decodeVersion, type AnnotationsResponse } from './decode'
import { makeResourceApi, responseId } from './resource'

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

function decodeSystem(res: SystemResponse): System {
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

const systems = makeResourceApi<System, SystemResponse>({
  name: 'System',
  namePlural: 'systems',
  listPath: API.SYSTEMS.list,
  byIdPath: API.SYSTEMS.byId,
  mocks: async () => (await import('@/mocks/systems')).systems,
  idOf: (s) => s.systemId,
  decode: decodeSystem,
})

export const fetchSystems = systems.fetchAll
export const fetchSystemById = systems.fetchById

interface SystemInstanceResponse {
  systemInstanceId?: string
  instanceId?: string
  displayName?: string
  system?: string
  context?: string
  annotations?: AnnotationsResponse
}

function decodeSystemInstance(res: SystemInstanceResponse): SystemInstance {
  return {
    systemInstanceId: responseId(res, 'systemInstanceId'),
    displayName: res.displayName ?? '',
    system: res.system ?? '',
    context: res.context,
    annotations: decodeAnnotations(res.annotations),
  }
}

const systemInstances = makeResourceApi<SystemInstance, SystemInstanceResponse>({
  name: 'System instance',
  namePlural: 'system instances',
  listPath: API.SYSTEM_INSTANCES.list,
  byIdPath: API.SYSTEM_INSTANCES.byId,
  mocks: async () => (await import('@/mocks/systems')).systemInstances,
  idOf: (i) => i.systemInstanceId,
  decode: decodeSystemInstance,
})

export const fetchSystemInstances = systemInstances.fetchAll
export const fetchSystemInstanceById = systemInstances.fetchById
