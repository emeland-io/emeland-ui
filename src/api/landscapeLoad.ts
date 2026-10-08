import { z } from 'zod'
import { USE_MOCKS, getJson, ApiHttpError } from './fetch'
import { zInstanceListItem } from './gen/zod.gen'
import { responseId } from './resource'

export type LandscapeResourcePaths = {
  list: string
  byId: (id: string) => string
}

export async function loadLandscapeDetails<T>(options: {
  namePlural: string
  paths: LandscapeResourcePaths
  /** wire fixtures when USE_MOCKS */
  mocks: () => Promise<unknown[]>
  idKey: string
  decode: (raw: Record<string, unknown>) => T
}): Promise<T[]> {
  if (USE_MOCKS) {
    const wire = await options.mocks()
    return wire.map((w) => options.decode(w as Record<string, unknown>))
  }

  let list: unknown
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

  const items = z.array(zInstanceListItem).parse(list)
  const settled = await Promise.allSettled(
    items.map(async (item) => {
      const id = item.instanceId
      if (!id) throw new Error(`${options.namePlural} list item missing instanceId`)
      const raw = await getJson<unknown>(
        options.paths.byId(id),
        `${options.namePlural.slice(0, -1)} ${id}`,
      )
      if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
        throw new Error(`invalid ${options.namePlural} detail for ${id}`)
      }
      const rec = raw as Record<string, unknown>
      // ensure id key is present for responseId fallbacks
      const withId = { ...rec, [options.idKey]: responseId(rec, options.idKey) || id }
      return options.decode(withId)
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
      console.warn(`[api] skipped ${options.namePlural} detail`, result.reason)
    }
  }
  return out
}
