import { API } from '@/constants/api'
import type { CapabilityVersionRef } from '@/types/capability'
import { decodeVersion } from './decode'
import {
  attachVariantsToVersions,
  clearCapabilityGraphCache,
  fetchVariantsByCapabilityVersion,
} from './capabilityGraph'
import { loadLandscapeDetails } from './landscapeLoad'

/** Flat CapabilityVersion landscape resource (modelsrv Phase 3) */
export type CapabilityVersionWire = {
  capabilityVersionId?: string
  instanceId?: string
  displayName?: string
  capability: string
  version?: {
    version?: string
    availableFrom?: string
    deprecatedFrom?: string
    terminatedFrom?: string
  }
}

function idOf(raw: Record<string, unknown>, key: string): string {
  const own = raw[key]
  if (typeof own === 'string' && own) return own
  const inst = raw.instanceId
  return typeof inst === 'string' && inst ? inst : ''
}

function decodeCapabilityVersion(raw: Record<string, unknown>): CapabilityVersionRef & {
  capability: string
} {
  const capabilityVersionId = idOf(raw, 'capabilityVersionId')
  const capability = typeof raw.capability === 'string' ? raw.capability : ''
  if (!capabilityVersionId || !capability) {
    throw new Error('CapabilityVersion missing id or capability')
  }
  const ver = raw.version
  const versionObj =
    ver && typeof ver === 'object' && !Array.isArray(ver)
      ? (ver as {
          version?: string
          availableFrom?: string
          deprecatedFrom?: string
          terminatedFrom?: string
        })
      : undefined
  return {
    capabilityVersionId,
    capability,
    ...(versionObj
      ? { version: decodeVersion({ version: versionObj.version ?? '', ...versionObj }) }
      : {}),
  }
}

let cachedByCapability: Map<string, CapabilityVersionRef[]> | null = null
let inflight: Promise<Map<string, CapabilityVersionRef[]>> | null = null

/** Drop the join cache (e.g. after a store reload). */
export function clearCapabilityVersionsCache(): void {
  cachedByCapability = null
  inflight = null
  clearCapabilityGraphCache()
}

async function loadCapabilityVersionsByCapability(): Promise<Map<string, CapabilityVersionRef[]>> {
  const [details, variantsByVersion] = await Promise.all([
    loadLandscapeDetails({
      namePlural: 'capability versions',
      paths: API.CAPABILITY_VERSIONS,
      mocks: async () => (await import('@/mocks/capabilityVersions')).capabilityVersions,
      idKey: 'capabilityVersionId',
      decode: decodeCapabilityVersion,
    }),
    fetchVariantsByCapabilityVersion(),
  ])

  const byCapability = new Map<string, CapabilityVersionRef[]>()
  for (const d of details) {
    const { capability, ...ref } = d
    const withVariants = attachVariantsToVersions([ref], variantsByVersion)[0] ?? ref
    const bucket = byCapability.get(capability) ?? []
    bucket.push(withVariants)
    byCapability.set(capability, bucket)
  }
  return byCapability
}

/**
 * Load every CapabilityVersion (list + detail, or mocks), join variants from the
 * capability graph and group by parent capability id.
 *
 * Dedupes concurrent callers and caches the result for the session. List route
 * 404/501 soft-fails to an empty map so older modelsrv builds still show the
 * capability catalog (as "no versions").
 */
export async function fetchCapabilityVersionsByCapability(): Promise<
  Map<string, CapabilityVersionRef[]>
> {
  if (cachedByCapability) return cachedByCapability
  if (inflight) return inflight

  inflight = loadCapabilityVersionsByCapability()
    .then((map) => {
      cachedByCapability = map
      return map
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}
