import { API } from '@/constants/api'
import { z } from 'zod'
import type { Capability, CapabilityVersionRef, ValidValue, Variant } from '@/types/capability'
import { decodeAnnotations, decodeVersion } from './decode'
import { makeResourceApi } from './resource'
import type {
  Capability as CapabilityWire,
  CapabilityVersionRef as CapabilityVersionRefWire,
} from './gen/types.gen'
import { zCapability, zCapabilityVersionRef, zInstanceListItem } from './gen/zod.gen'

interface ValidValueWire {
  parameter: string
  values?: string[]
}

interface VariantDependencyWire {
  capability: string
  outputParameters?: ValidValueWire[]
}

interface VariantWire {
  inputParameters?: ValidValueWire[]
  dependencies?: VariantDependencyWire[]
}

export type CapabilityWireWithDescription = Omit<CapabilityWire, 'versions'> & {
  description?: string
  versions?: (CapabilityVersionRefWire & { variants?: VariantWire[] })[]
}

// the diagram's fields ride ahead of the spec: pass unknown keys through at
// every nesting level (zod strips per object), so the description and the
// embedded variants survive response validation
const zCapabilityResponse = zCapability
  .extend({ versions: z.array(zCapabilityVersionRef.passthrough()).optional() })
  .passthrough()

function decodeValidValue(res: ValidValueWire): ValidValue {
  return { parameter: res.parameter, values: res.values ?? [] }
}

function decodeVariant(res: VariantWire): Variant {
  return {
    ...(res.inputParameters?.length
      ? { inputParameters: res.inputParameters.map(decodeValidValue) }
      : {}),
    ...(res.dependencies?.length
      ? {
          dependencies: res.dependencies.map((d) => ({
            capability: d.capability,
            ...(d.outputParameters?.length
              ? { outputParameters: d.outputParameters.map(decodeValidValue) }
              : {}),
          })),
        }
      : {}),
  }
}

function decodeVersionRef(
  res: CapabilityVersionRefWire & { variants?: VariantWire[] },
): CapabilityVersionRef {
  return {
    capabilityVersionId: res.capabilityVersionId,
    ...(res.version ? { version: decodeVersion(res.version) } : {}),
    ...(res.variants?.length ? { variants: res.variants.map(decodeVariant) } : {}),
  }
}

function decodeCapability(res: CapabilityWireWithDescription): Capability {
  return {
    capabilityId: res.capabilityId,
    displayName: res.displayName,
    ...(res.description ? { description: res.description } : {}),
    ...(res.versions ? { versions: res.versions.map(decodeVersionRef) } : {}),
    annotations: decodeAnnotations(res.annotations),
  }
}

const capabilities = makeResourceApi<Capability, CapabilityWireWithDescription>({
  name: 'Capability',
  namePlural: 'capabilities',
  listPath: API.CAPABILITIES.list,
  byIdPath: API.CAPABILITIES.byId,
  mocks: async () => (await import('@/mocks/capabilities')).capabilities,
  idKey: 'capabilityId',
  idOf: (c) => c.capabilityId,
  listSchema: zInstanceListItem,
  requireListFields: ['instanceId', 'displayName'],
  responseSchema: zCapabilityResponse,
  decode: decodeCapability,
})

export const fetchCapabilities = capabilities.fetchAll
export const fetchCapabilityById = capabilities.fetchById
