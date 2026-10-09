import { API } from '@/constants/api'
import type { Parameter } from '@/types/parameter'
import { decodeAnnotations } from './decode'
import { makeResourceApi } from './resource'
import type { Parameter as ParameterWire } from './gen/types.gen'
import { zParameter } from './gen/zod.gen'
import { fetchValidValues, type ValidValueRow } from './capabilityGraph'

type ParameterWireWithDescription = ParameterWire & { description?: string }

// pass unknown keys through instead of zod's default strip, so the
// frontend-first description survives response validation
const zParameterResponse = zParameter.passthrough()

function decodeParameter(res: ParameterWireWithDescription): Parameter {
  return {
    parameterId: res.parameterId,
    displayName: res.displayName,
    ...(res.description ? { description: res.description } : {}),
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
  fullList: true,
  responseSchema: zParameterResponse,
  decode: decodeParameter,
})

/** A parameter's value set lives on the ValidValue resources pointing at it */
function withValues(params: Parameter[], validValues: ValidValueRow[]): Parameter[] {
  const byParameter = new Map<string, string[]>()
  for (const vv of validValues) {
    const values = byParameter.get(vv.parameter) ?? []
    values.push(vv.displayName)
    byParameter.set(vv.parameter, values)
  }
  return params.map((p) => {
    const values = byParameter.get(p.parameterId)
    return values?.length ? { ...p, values } : p
  })
}

export async function fetchParameters(): Promise<Parameter[]> {
  const [params, validValues] = await Promise.all([parameters.fetchAll(), fetchValidValues()])
  return withValues(params, validValues)
}

export async function fetchParameterById(id: string): Promise<Parameter> {
  const [param, validValues] = await Promise.all([parameters.fetchById(id), fetchValidValues()])
  return withValues([param], validValues)[0]!
}
