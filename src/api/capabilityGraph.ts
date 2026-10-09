import { API } from '@/constants/api'
import type {
  CapabilityVersionRef,
  ValidValue,
  Variant,
  VariantDependency,
} from '@/types/capability'
import { loadLandscapeDetails } from './landscapeLoad'
import { responseId } from './resource'
import type {
  Dependency as DependencyWire,
  ValidValue as ValidValueWire,
  Variant as VariantWire,
} from './gen/types.gen'
import { zDependency, zValidValue, zVariant } from './gen/zod.gen'

export type { DependencyWire, ValidValueWire, VariantWire }

export type ValidValueRow = { validValueId: string; displayName: string; parameter: string }
type VariantRow = { variantId: string; capabilityVersion: string; requires: string[] }
type DependencyRow = {
  variant: string
  capability: string
  mappings: { fromValidValueId: string; toValidValueId: string }[]
}

let cachedVariantsByVersion: Map<string, Variant[]> | null = null
let inflight: Promise<Map<string, Variant[]>> | null = null
let validValuesInflight: Promise<ValidValueRow[]> | null = null

/** Drop the variant/dependency join cache (with capability versions on catalog reload) */
export function clearCapabilityGraphCache(): void {
  cachedVariantsByVersion = null
  inflight = null
}

function str(raw: Record<string, unknown>, key: string): string {
  const v = raw[key]
  return typeof v === 'string' ? v : ''
}

function decodeValidValueRow(raw: Record<string, unknown>): ValidValueRow {
  const validValueId = responseId(raw, 'validValueId')
  const displayName = str(raw, 'displayName')
  const parameter = str(raw, 'parameter')
  if (!validValueId || !parameter) {
    throw new Error('ValidValue missing id or parameter')
  }
  return { validValueId, displayName, parameter }
}

function decodeVariantRow(raw: Record<string, unknown>): VariantRow {
  const variantId = responseId(raw, 'variantId')
  const capabilityVersion = str(raw, 'capabilityVersion')
  if (!variantId || !capabilityVersion) {
    throw new Error('Variant missing id or capabilityVersion')
  }
  const requires = Array.isArray(raw.requires)
    ? raw.requires.filter((x): x is string => typeof x === 'string' && x.length > 0)
    : []
  return { variantId, capabilityVersion, requires }
}

function decodeDependencyRow(raw: Record<string, unknown>): DependencyRow {
  const variant = str(raw, 'variant')
  const capability = str(raw, 'capability')
  if (!variant || !capability) {
    throw new Error('Dependency missing variant or capability')
  }
  const mappings: DependencyRow['mappings'] = []
  if (Array.isArray(raw.mappings)) {
    for (const m of raw.mappings) {
      if (!m || typeof m !== 'object') continue
      const rec = m as Record<string, unknown>
      const fromValidValueId = str(rec, 'fromValidValueId')
      const toValidValueId = str(rec, 'toValidValueId')
      if (fromValidValueId && toValidValueId) {
        mappings.push({ fromValidValueId, toValidValueId })
      }
    }
  }
  return { variant, capability, mappings }
}

function groupRequiresAsInputParameters(
  requires: string[],
  byId: Map<string, ValidValueRow>,
): ValidValue[] | undefined {
  const byParam = new Map<string, string[]>()
  for (const id of requires) {
    const vv = byId.get(id)
    if (!vv) continue
    const values = byParam.get(vv.parameter) ?? []
    values.push(vv.displayName)
    byParam.set(vv.parameter, values)
  }
  if (!byParam.size) return undefined
  return [...byParam.entries()].map(([parameter, values]) => ({ parameter, values }))
}

function mappingsAsOutputParameters(
  mappings: DependencyRow['mappings'],
  byId: Map<string, ValidValueRow>,
): ValidValue[] | undefined {
  const byParam = new Map<string, string[]>()
  for (const m of mappings) {
    const vv = byId.get(m.toValidValueId)
    if (!vv) continue
    const values = byParam.get(vv.parameter) ?? []
    values.push(vv.displayName)
    byParam.set(vv.parameter, values)
  }
  if (!byParam.size) return undefined
  return [...byParam.entries()].map(([parameter, values]) => ({ parameter, values }))
}

function buildVariantsByVersion(
  validValues: ValidValueRow[],
  variants: VariantRow[],
  dependencies: DependencyRow[],
): Map<string, Variant[]> {
  const vvById = new Map(validValues.map((v) => [v.validValueId, v]))
  const depsByVariant = new Map<string, DependencyRow[]>()
  for (const d of dependencies) {
    const bucket = depsByVariant.get(d.variant) ?? []
    bucket.push(d)
    depsByVariant.set(d.variant, bucket)
  }

  const byVersion = new Map<string, Variant[]>()
  for (const v of variants) {
    const inputParameters = groupRequiresAsInputParameters(v.requires, vvById)
    const deps: VariantDependency[] = (depsByVariant.get(v.variantId) ?? []).map((d) => {
      const outputParameters = mappingsAsOutputParameters(d.mappings, vvById)
      return {
        capability: d.capability,
        ...(outputParameters?.length ? { outputParameters } : {}),
      }
    })
    const domain: Variant = {
      ...(inputParameters?.length ? { inputParameters } : {}),
      ...(deps.length ? { dependencies: deps } : {}),
    }
    const bucket = byVersion.get(v.capabilityVersion) ?? []
    bucket.push(domain)
    byVersion.set(v.capabilityVersion, bucket)
  }
  return byVersion
}

/**
 * Load every ValidValue (shared by the capability graph, parameter values and
 * order bound values). Dedupes concurrent callers only, so stores loading in
 * parallel share one request and a later reload sees fresh data.
 */
export function fetchValidValues(): Promise<ValidValueRow[]> {
  if (!validValuesInflight) {
    validValuesInflight = loadLandscapeDetails({
      namePlural: 'valid values',
      paths: API.VALID_VALUES,
      mocks: async () => (await import('@/mocks/validValues')).validValues,
      idKey: 'validValueId',
      schema: zValidValue,
      decode: decodeValidValueRow,
    }).finally(() => {
      validValuesInflight = null
    })
  }
  return validValuesInflight
}

async function loadVariantsByCapabilityVersion(): Promise<Map<string, Variant[]>> {
  const [validValues, variants, dependencies] = await Promise.all([
    fetchValidValues(),
    loadLandscapeDetails({
      namePlural: 'variants',
      paths: API.VARIANTS,
      mocks: async () => (await import('@/mocks/variants')).variants,
      idKey: 'variantId',
      schema: zVariant,
      decode: decodeVariantRow,
    }),
    loadLandscapeDetails({
      namePlural: 'dependencies',
      paths: API.DEPENDENCIES,
      mocks: async () => (await import('@/mocks/dependencies')).dependencies,
      idKey: 'dependencyId',
      schema: zDependency,
      decode: decodeDependencyRow,
    }),
  ])

  return buildVariantsByVersion(validValues, variants, dependencies)
}

/**
 * Load Variant + Dependency + ValidValue resources and group UI-shaped variants
 * by CapabilityVersion id.
 */
export async function fetchVariantsByCapabilityVersion(): Promise<Map<string, Variant[]>> {
  if (cachedVariantsByVersion) return cachedVariantsByVersion
  if (inflight) return inflight

  inflight = loadVariantsByCapabilityVersion()
    .then((map) => {
      cachedVariantsByVersion = map
      return map
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}

/** Attach nested variants onto version refs using the capability graph join */
export function attachVariantsToVersions(
  versions: CapabilityVersionRef[],
  variantsByVersion: Map<string, Variant[]>,
): CapabilityVersionRef[] {
  return versions.map((v) => {
    const variants = variantsByVersion.get(v.capabilityVersionId)
    return variants?.length ? { ...v, variants } : v
  })
}
