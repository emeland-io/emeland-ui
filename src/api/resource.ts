import { z } from 'zod'
import { USE_MOCKS, getJson } from './fetch'
import { decodeAnnotations, type AnnotationsResponse } from './decode'
import { parseApiResponse, warnOnUnknownKeys, ApiValidationError, type ApiIssue } from './validate'
import type { TypeEntity } from '@/types/common'
import type { InstanceListItem } from './gen/types.gen'

/**
 * The shared shape of every resource api module: a `list` endpoint plus a
 * `byId` endpoint, served from the bundled mocks when USE_MOCKS is set.
 *
 * Responses are validated before decoding against the zod schemas generated
 * from the modelsrv OpenAPI spec (src/api/gen — regenerate with
 * `npm run api:gen`), so malformed payloads fail with a descriptive
 * ApiValidationError instead of leaking undefineds into the UI. On top of
 * schema validation, the boundary asserts the rules the spec cannot express:
 * non-empty ids on every payload (`requireResourceId`) and the fields the
 * minimal list endpoints must carry (`requireListFields`).
 *
 * `decode` turns the byId response into the domain type, list items are
 * minimal (id + displayName) and expand through `fromList`, which defaults
 * to decoding a minimal response, since every decoder fills defaults.
 * The bundled mocks are wire-format fixtures and go through the same
 * validate -> decode pipeline as live responses
 *
 * Lists fail fast: one malformed item rejects the whole list (a partial
 * render of a landscape is worse than an error banner). Revisit here if a
 * flaky backend ever makes per-item tolerance the better trade.
 */
export function makeResourceApi<
  T,
  R extends object,
  L extends { displayName?: string } = InstanceListItem,
>(config: {
  /** singular for byId errors ('API'), plural for list errors ('APIs') */
  name: string
  namePlural: string
  listPath: string
  byIdPath: (id: string) => string
  /** the bundled mocks, in wire format */
  mocks: () => Promise<unknown[]>
  /** wire id key of the resource ('systemId'); ids may also arrive as instanceId */
  idKey: string
  idOf: (item: T) => string
  /** validates one item of the list response */
  listSchema: z.ZodType<L>
  /** validates the byId response */
  responseSchema: z.ZodType<R>
  /** fields every list item must carry, non-empty (the minimal list endpoints) */
  requireListFields?: readonly string[]
  /** expand a minimal list item; defaults to decoding it as a minimal response */
  fromList?: (item: L) => T
  /** decode the byId response; omit when it already matches the type */
  decode?: (res: R) => T
}) {
  const fromList =
    config.fromList ??
    ((item: L) =>
      config.decode!({
        instanceId: (item as unknown as { instanceId: string }).instanceId,
        displayName: item.displayName,
      } as R))

  /**
   * Validate + decode one detail payload. The id is read from the RAW payload
   * (the generated schemas strip the instanceId fallback key) and injected
   * under the resource's own id key BEFORE parsing, so the instanceId
   * fallback also satisfies schemas whose id field is required — spec
   * optionality must not decide whether the fallback works.
   */
  function decodeDetail(data: unknown, what: string): T {
    const raw =
      data !== null && typeof data === 'object' && !Array.isArray(data)
        ? { ...data, [config.idKey]: requireResourceId(data, config.idKey, what) }
        : data // non-objects fall through to the schema for a descriptive error
    const res = parseApiResponse(config.responseSchema, raw, what)
    return config.decode ? config.decode(res) : (res as unknown as T)
  }

  /** validate + decode the bundled mocks through the same pipeline as live data */
  function decodeMocks(wire: unknown[], what: string): T[] {
    return wire.map((w) => decodeDetail(w, what))
  }

  // mocks are static for the session: validate+decode once, not per fetch
  let mockCache: T[] | null = null
  async function loadMocks(what: string): Promise<T[]> {
    if (!mockCache) mockCache = decodeMocks(await config.mocks(), what)
    return mockCache
  }

  async function fetchAll(): Promise<T[]> {
    if (USE_MOCKS) return loadMocks(config.namePlural)
    const data = await getJson<unknown>(config.listPath, config.namePlural)
    const items = parseApiResponse(z.array(config.listSchema), data, config.namePlural)
    // drift check on the first item (the array-level parse sees the whole list)
    if (Array.isArray(data)) warnOnUnknownKeys(data[0], items[0], config.namePlural)
    const required = config.requireListFields
    if (required) {
      items.forEach((item, i) => requireListFields(item, required, i, config.namePlural))
    }
    return items.map(fromList)
  }

  async function fetchById(id: string): Promise<T> {
    if (USE_MOCKS) {
      const found = (await loadMocks(`${config.name} ${id}`)).find(
        (item) => config.idOf(item) === id,
      )
      if (!found) throw new Error(`${config.name} ${id} not found in mocks`)
      return found
    }
    const data = await getJson<unknown>(config.byIdPath(id), `${config.name} ${id}`)
    return decodeDetail(data, `${config.name} ${id}`)
  }

  return { fetchAll, fetchById }
}

/** The fields the minimal list endpoints (zInstanceListItem) must carry */
export const MINIMAL_LIST_FIELDS = ['instanceId', 'displayName'] as const

/**
 * Detail payloads must carry a non-empty id (own key or instanceId fallback);
 * returns the resolved id. Reads the raw payload because generated schemas
 * strip the fallback key
 */
export function requireResourceId(res: unknown, idKey: string, what: string): string {
  const id = responseId(res as object, idKey)
  if (!id) {
    throw new ApiValidationError(what, [
      { path: [idKey], message: `missing id: expected ${idKey} or instanceId` },
    ])
  }
  return id
}

/** List items of the minimal list endpoints must carry these fields, non-empty */
export function requireListFields(
  item: object,
  fields: readonly string[],
  index: number,
  what: string,
): void {
  const issues: ApiIssue[] = []
  const rec = item as Record<string, unknown>
  for (const f of fields) {
    const v = rec[f]
    if (typeof v !== 'string' || v.length === 0) {
      issues.push({ path: [index, f], message: 'missing, empty, or not a string' })
    }
  }
  if (issues.length) throw new ApiValidationError(what, issues)
}

/** The resource id of a response: its own id field, falling back to a non-empty instanceId */
export function responseId(res: object, key: string): string {
  const r = res as Record<string, unknown>
  const own = r[key]
  if (typeof own === 'string' && own) return own
  const inst = r.instanceId
  return typeof inst === 'string' && inst ? inst : ''
}

/** Decode a type entity (context/node/finding type), tolerating the instanceId id fallback */
export function decodeTypeEntity<K extends string>(
  idKey: K,
  res: {
    instanceId?: string
    displayName?: string
    description?: string
    annotations?: unknown
  } & Record<string, unknown>,
): TypeEntity<K> {
  return {
    [idKey]: responseId(res, idKey),
    displayName: res.displayName ?? '',
    description: res.description ?? '',
    annotations: decodeAnnotations(res.annotations as AnnotationsResponse | undefined),
  } as TypeEntity<K>
}
