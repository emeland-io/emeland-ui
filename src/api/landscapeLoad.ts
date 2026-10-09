import type { z } from 'zod'
import { USE_MOCKS, getJson, ApiHttpError } from './fetch'
import { listRefId, responseId } from './resource'
import { ApiValidationError } from './validate'

export type LandscapeResourcePaths = {
  list: string
  byId: (id: string) => string
}

type DecodeOptions<T> = {
  namePlural: string
  idKey: string
  schema?: z.ZodType
  decode: (raw: Record<string, unknown>) => T
}

/**
 * Load a Phase 3 landscape collection in either list shape modelsrv serves
 * (`FullListResponse` in tools/gen/wire_meta.go — see `listRefId`):
 * - full objects: decoded straight from the one list request
 * - InstanceList refs: each expanded through its byId endpoint
 */
export async function loadLandscapeDetails<T>(
  options: DecodeOptions<T> & {
    paths: LandscapeResourcePaths
    /** wire fixtures when USE_MOCKS */
    mocks: () => Promise<unknown[]>
  },
): Promise<T[]> {
  let list: unknown
  if (USE_MOCKS) {
    list = await options.mocks()
  } else {
    try {
      list = await getJson<unknown>(options.paths.list, options.namePlural)
    } catch (err) {
      if (err instanceof ApiHttpError && (err.status === 404 || err.status === 501)) {
        // eslint-disable-next-line no-console -- intentional soft-fail diagnostics
        if (import.meta.env.DEV) console.warn(`[api] ${options.namePlural} unavailable`, err)
        return []
      }
      throw err
    }
  }

  if (!Array.isArray(list)) {
    throw new ApiValidationError(options.namePlural, [{ path: [], message: 'expected an array' }])
  }

  const settled = await Promise.allSettled(
    list.map(async (item, i) => {
      const what = `${options.namePlural}[${i}]`
      const ref = listRefId(item, options.idKey, what)
      if (ref === null) return decodeItem(item, options)
      const raw = await getJson<unknown>(
        options.paths.byId(ref),
        `${options.namePlural.slice(0, -1)} ${ref}`,
      )
      return decodeItem(raw, options, ref)
    }),
  )

  const out: T[] = []
  for (const result of settled) {
    if (result.status === 'fulfilled') {
      out.push(result.value)
      continue
    }
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console -- intentional soft-fail diagnostics
      console.warn(`[api] skipped ${options.namePlural} item`, result.reason)
    }
  }
  return out
}

function decodeItem<T>(item: unknown, options: DecodeOptions<T>, fallbackId = ''): T {
  if (item === null || typeof item !== 'object' || Array.isArray(item)) {
    throw new ApiValidationError(options.namePlural, [{ path: [], message: 'expected an object' }])
  }
  const rec = item as Record<string, unknown>
  const withId = { ...rec, [options.idKey]: responseId(rec, options.idKey) || fallbackId }
  if (options.schema) {
    const parsed = options.schema.safeParse(withId)
    if (!parsed.success) {
      throw new ApiValidationError(options.namePlural, [
        { path: [], message: parsed.error.message },
      ])
    }
  }
  return options.decode(withId)
}
