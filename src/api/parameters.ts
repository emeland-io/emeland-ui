import { API } from '@/constants/api'
import type { Parameter } from '@/types/parameter'
import { decodeAnnotations } from './decode'
import { makeResourceApi } from './resource'
import type { Parameter as ParameterWire } from './gen/types.gen'
import { zInstanceListItem, zParameter } from './gen/zod.gen'

type ParameterWireWithDescription = ParameterWire & { description?: string }

// pass unknown keys through instead of zod's default strip, so the
// frontend-first description survives response validation
const zParameterResponse = zParameter.passthrough()

function decodeParameter(res: ParameterWireWithDescription): Parameter {
  return {
    parameterId: res.parameterId,
    displayName: res.displayName,
    ...(res.description ? { description: res.description } : {}),
    ...(res.values ? { values: res.values } : {}),
    annotations: decodeAnnotations(res.annotations),
  }
}

const parameters = makeResourceApi<Parameter, ParameterWireWithDescription>({
  name: 'Parameter',
  namePlural: 'parameters',
  listPath: API.PARAMETERS.list,
  byIdPath: API.PARAMETERS.byId,
  mocks: async () => (await import('@/mocks/parameters')).parameters,
  idKey: 'parameterId',
  idOf: (p) => p.parameterId,
  listSchema: zInstanceListItem,
  requireListFields: ['instanceId', 'displayName'],
  responseSchema: zParameterResponse,
  decode: decodeParameter,
})

export const fetchParameters = parameters.fetchAll
export const fetchParameterById = parameters.fetchById
