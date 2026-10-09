import { API } from '@/constants/api'
import type { Capability } from '@/types/capability'
import { decodeAnnotations, type AnnotationsResponse } from './decode'
import { makeResourceApi, responseId } from './resource'
import {
  clearCapabilityVersionsCache,
  fetchCapabilityVersionsByCapability,
} from './capabilityVersions'
import { zCapability } from './gen/zod.gen'

export type CapabilityWireWithDescription = {
  capabilityId?: string
  instanceId?: string
  displayName: string
  description?: string
  offers?: string[]
  annotations?: unknown
}

// pass unknown keys through instead of zod's default strip, so the
// frontend-first description survives response validation
const zCapabilityResponse = zCapability.passthrough()

function decodeCapability(res: CapabilityWireWithDescription): Capability {
  const annotations = decodeAnnotations(res.annotations as AnnotationsResponse | undefined)
  return {
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
  fullList: true,
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
