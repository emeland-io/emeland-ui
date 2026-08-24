import { USE_MOCKS, getJson } from './fetch'
import { decodeAnnotations, type AnnotationsResponse, type InstanceListItem } from './decode'
import type { TypeEntity } from '@/types/common'

/**
 * The shared shape of every resource api module: a `list` endpoint plus a
 * `byId` endpoint, served from the bundled mocks when USE_MOCKS is set.
 *
 * `decode` turns the byId response into the domain type; list items are
 * minimal (id + displayName) and expand through `fromList`, which defaults
 * to decoding a minimal response, since every decoder fills defaults
 */
export function makeResourceApi<
  T,
  R = T,
  L extends { displayName: string } = InstanceListItem,
>(config: {
  /** singular for byId errors ('API'), plural for list errors ('APIs') */
  name: string
  namePlural: string
  listPath: string
  byIdPath: (id: string) => string
  /** the bundled mocks for this resource */
  mocks: () => Promise<T[]>
  idOf: (item: T) => string
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

  async function fetchAll(): Promise<T[]> {
    if (USE_MOCKS) return config.mocks()
    const data = await getJson<L[]>(config.listPath, config.namePlural)
    return data.map(fromList)
  }

  async function fetchById(id: string): Promise<T> {
    if (USE_MOCKS) {
      const found = (await config.mocks()).find((item) => config.idOf(item) === id)
      if (!found) throw new Error(`${config.name} ${id} not found in mocks`)
      return found
    }
    const res = await getJson<R>(config.byIdPath(id), `${config.name} ${id}`)
    return config.decode ? config.decode(res) : (res as unknown as T)
  }

  return { fetchAll, fetchById }
}

/** The resource id of a response: its own id field, falling back to instanceId */
export function responseId(res: object, key: string): string {
  const r = res as Record<string, unknown>
  return (r[key] as string) ?? (r.instanceId as string) ?? ''
}

/** Decode a type entity (context/node/finding type), tolerating the instanceId id fallback */
export function decodeTypeEntity<K extends string>(
  idKey: K,
  res: Record<string, unknown>,
): TypeEntity<K> {
  return {
    [idKey]: responseId(res, idKey),
    displayName: (res.displayName as string) ?? '',
    description: (res.description as string) ?? '',
    annotations: decodeAnnotations(res.annotations as AnnotationsResponse | undefined),
  } as TypeEntity<K>
}
