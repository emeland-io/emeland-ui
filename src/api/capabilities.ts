import { API } from '@/constants/api'
import { z } from 'zod'
import type { Capability } from '@/types/capability'
import { decodeAnnotations, annotationsResponseSchema, type AnnotationsResponse } from './decode'
import { makeResourceApi, responseId } from './resource'
import {
  clearCapabilityVersionsCache,
  fetchCapabilityVersionsByCapability,
} from './capabilityVersions'
import { zInstanceListItem } from './gen/zod.gen'

export type CapabilityWireWithDescription = {
  capabilityId?: string
  instanceId?: string
  displayName: string
  description?: string
  offers?: string[]
  annotations?: unknown
}

const zCapabilityResponse = z
  .object({
    capabilityId: z.string().min(1).optional(),
    instanceId: z.string().min(1).optional(),
    displayName: z.string(),
    description: z.string().optional(),
    offers: z.array(z.string().min(1)).optional(),
    annotations: annotationsResponseSchema.optional(),
  })
  .passthrough()

function decodeCapability(res: CapabilityWireWithDescription): Capability {
  const annotations = decodeAnnotations(res.annotations as AnnotationsResponse | undefined)
  return {
    // list endpoints only return instanceId; detail payloads carry capabilityId
    capabilityId: responseId(res, 'capabilityId'),
    displayName: res.displayName,
    ...(res.description || annotations['emeland.io/summary']
      ? { description: res.description ?? annotations['emeland.io/summary'] }
      : {}),
    annotations,
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

async function withVersions(caps: Capability[]): Promise<Capability[]> {
  if (!caps.length) return caps
  const byCapability = await fetchCapabilityVersionsByCapability()
  return caps.map((c) => {
    const versions = byCapability.get(c.capabilityId)
    return versions?.length ? { ...c, versions } : c
  })
}

export async function fetchCapabilities(): Promise<Capability[]> {
  // always reload versions with the catalog so a store.reload() sees fresh data
  clearCapabilityVersionsCache()
  return withVersions(await capabilities.fetchAll())
}

export async function fetchCapabilityById(id: string): Promise<Capability> {
  const [joined] = await withVersions([await capabilities.fetchById(id)])
  return joined
}
