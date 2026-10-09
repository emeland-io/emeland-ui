import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type * as FetchModule from '@/api/fetch'

vi.mock('@/api/fetch', async (importOriginal) => ({
  ...(await importOriginal<typeof FetchModule>()),
  USE_MOCKS: false,
  getJson: vi.fn(),
}))

import { ApiHttpError, getJson } from '@/api/fetch'
import { API } from '@/constants/api'
import { ApiValidationError } from '@/api/validate'
import { listRefId } from '@/api/resource'
import { loadLandscapeDetails } from '@/api/landscapeLoad'
import { fetchCapabilities, fetchCapabilityById } from '@/api/capabilities'
import { fetchParameters } from '@/api/parameters'
import { fetchOrders, fetchOrderById } from '@/api/orders'
import { capabilities } from '@/mocks/capabilities'
import { capabilityVersions } from '@/mocks/capabilityVersions'
import { variants } from '@/mocks/variants'
import { dependencies } from '@/mocks/dependencies'
import { validValues } from '@/mocks/validValues'
import { parameters } from '@/mocks/parameters'
import { orders } from '@/mocks/orders'
import { orderItems } from '@/mocks/orderItems'
import { boundValues } from '@/mocks/boundValues'
import { systemInstances } from '@/mocks/systems'

const getJsonMock = vi.mocked(getJson)

/**
 * modelsrv picks each Phase 3 list endpoint's shape at codegen
 * (FullListResponse in tools/gen/wire_meta.go): `true` serves full objects,
 * `false` InstanceList refs. The fake backend serves the bundled wire mocks
 * in either shape so both paths run against the same data.
 */
const FULL_LIST_RESOURCES: [{ list: string; byId: (id: string) => string }, object[], string][] = [
  [API.CAPABILITIES, capabilities, 'capabilityId'],
  [API.CAPABILITY_VERSIONS, capabilityVersions, 'capabilityVersionId'],
  [API.VARIANTS, variants, 'variantId'],
  [API.DEPENDENCIES, dependencies, 'dependencyId'],
  [API.VALID_VALUES, validValues, 'validValueId'],
  [API.PARAMETERS, parameters, 'parameterId'],
  [API.ORDERS, orders, 'orderId'],
  [API.ORDER_ITEMS, orderItems, 'orderItemId'],
  [API.BOUND_VALUES, boundValues, 'boundValueId'],
]

/** SystemInstance is not FullListResponse — always InstanceList + byId */
const INSTANCE_LIST_RESOURCES: [{ list: string; byId: (id: string) => string }, object[], string][] =
  [[API.SYSTEM_INSTANCES, systemInstances, 'systemInstanceId']]

type FullListResponse = boolean

function asRefs(
  paths: { byId: (id: string) => string },
  rows: Record<string, unknown>[],
  idKey: string,
) {
  return rows.map((r) => ({
    instanceId: r[idKey],
    displayName: r.displayName,
    reference: paths.byId(r[idKey] as string),
  }))
}

function serve(fullListResponse: FullListResponse) {
  getJsonMock.mockImplementation(async (path: string) => {
    for (const [paths, items, idKey] of FULL_LIST_RESOURCES) {
      const rows = items as Record<string, unknown>[]
      if (path === paths.list) return fullListResponse ? rows : asRefs(paths, rows, idKey)
      const hit = rows.find((r) => path === paths.byId(r[idKey] as string))
      if (hit) return hit
    }
    for (const [paths, items, idKey] of INSTANCE_LIST_RESOURCES) {
      const rows = items as Record<string, unknown>[]
      if (path === paths.list) return asRefs(paths, rows, idKey)
      const hit = rows.find((r) => path === paths.byId(r[idKey] as string))
      if (hit) return hit
    }
    throw new ApiHttpError(path, 404)
  })
}

const LIST_PATHS = new Set(
  [...FULL_LIST_RESOURCES, ...INSTANCE_LIST_RESOURCES].map(([paths]) => paths.list),
)
const calledPaths = () => getJsonMock.mock.calls.map(([path]) => path)
const byIdCalls = () => calledPaths().filter((p) => !LIST_PATHS.has(p))

beforeEach(() => {
  getJsonMock.mockReset()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('listRefId', () => {
  it('returns null for a full object (FullListResponse true)', () => {
    expect(listRefId({ capabilityId: 'c1', displayName: 'x' }, 'capabilityId', 'w')).toBeNull()
  })

  it('returns the instanceId of an InstanceList ref (FullListResponse false)', () => {
    expect(listRefId({ instanceId: 'c1', displayName: 'x' }, 'capabilityId', 'w')).toBe('c1')
  })

  it('prefers the own id key when both are present', () => {
    expect(listRefId({ capabilityId: 'c1', instanceId: 'c2' }, 'capabilityId', 'w')).toBeNull()
  })

  it('rejects items without any id', () => {
    expect(() => listRefId({ displayName: 'x' }, 'capabilityId', 'w')).toThrow(ApiValidationError)
    expect(() => listRefId({ capabilityId: '', instanceId: '' }, 'capabilityId', 'w')).toThrow(
      ApiValidationError,
    )
    expect(() => listRefId('nope', 'capabilityId', 'w')).toThrow(ApiValidationError)
  })
})

describe('loadLandscapeDetails', () => {
  const load = () =>
    loadLandscapeDetails({
      namePlural: 'valid values',
      paths: API.VALID_VALUES,
      mocks: async () => [],
      idKey: 'validValueId',
      decode: (raw) => raw.validValueId as string,
    })

  it('decodes full objects from the one list request (FullListResponse true)', async () => {
    serve(true)
    expect(await load()).toEqual(validValues.map((v) => v.validValueId))
    expect(calledPaths()).toEqual([API.VALID_VALUES.list])
  })

  it('expands InstanceList refs through byId (FullListResponse false)', async () => {
    serve(false)
    expect(await load()).toEqual(validValues.map((v) => v.validValueId))
    expect(byIdCalls()).toHaveLength(validValues.length)
  })

  it('handles a mixed list and skips items it cannot decode', async () => {
    const [a, b] = validValues
    getJsonMock.mockImplementation(async (path: string) => {
      if (path === API.VALID_VALUES.list) {
        return [
          a,
          { instanceId: b!.validValueId },
          { displayName: 'no id' },
          { instanceId: 'gone' },
        ]
      }
      if (path === API.VALID_VALUES.byId(b!.validValueId)) return b
      throw new ApiHttpError(path, 404)
    })
    expect(await load()).toEqual([a!.validValueId, b!.validValueId])
  })

  it('soft-fails a missing list route to an empty list', async () => {
    getJsonMock.mockRejectedValue(new ApiHttpError('valid values', 404))
    expect(await load()).toEqual([])
  })

  it('skips items that fail schema validation', async () => {
    serve(true)
    const { zValidValue } = await import('@/api/gen/zod.gen')
    getJsonMock.mockResolvedValueOnce([validValues[0], { validValueId: 'v-x', displayName: 'x' }])
    const out = await loadLandscapeDetails({
      namePlural: 'valid values',
      paths: API.VALID_VALUES,
      mocks: async () => [],
      idKey: 'validValueId',
      schema: zValidValue, // parameter is required
      decode: (raw) => raw.validValueId as string,
    })
    expect(out).toEqual([validValues[0]!.validValueId])
  })
})

describe.each([true, false] as FullListResponse[])(
  'Phase 3 resources with FullListResponse %s',
  (fullListResponse) => {
    beforeEach(() => serve(fullListResponse))

    it('loads capabilities with versions and variants joined', async () => {
      const caps = await fetchCapabilities()
      expect(caps).toHaveLength(capabilities.length)
      const mail = caps.find((c) => c.capabilityId === 'c1a2b3c4-0001-4a3b-8c1d-000000000001')!
      expect(mail.displayName).toBe('Managed mail server')
      expect(mail.description).toBe(capabilities[0]!.description)
      const v120 = mail.versions?.find(
        (v) => v.capabilityVersionId === 'c1a2b3c4-0001-4a3b-8c1d-00000000v101',
      )
      expect(v120?.variants?.length).toBe(2)
      if (fullListResponse) expect(byIdCalls()).toEqual([])
      else expect(byIdCalls().length).toBeGreaterThan(0)
    })

    it('loads one capability by id', async () => {
      const cap = await fetchCapabilityById('c1a2b3c4-0001-4a3b-8c1d-000000000003')
      expect(cap.displayName).toBe('Dedicated firewall rule')
      expect(cap.versions?.map((v) => v.capabilityVersionId)).toEqual([
        'c1a2b3c4-0001-4a3b-8c1d-00000000v300',
      ])
    })

    it('derives parameter values from the valid values', async () => {
      const params = await fetchParameters()
      const users = params.find((p) => p.parameterId === '5b6c7d8e-0001-4e5f-9a1b-00000000p101')
      expect(users?.values).toEqual(['10 users', '100 users', '1000 users'])
    })

    it('nests order items and bound values under their orders', async () => {
      const list = await fetchOrders()
      expect(list).toHaveLength(orders.length)
      expect(list.flatMap((o) => o.items)).toHaveLength(orderItems.length)
      expect(list.flatMap((o) => o.items.flatMap((i) => i.boundValues ?? []))).toHaveLength(
        boundValues.length,
      )

      const a1 = list.find((o) => o.orderId === '0a1b2c3d-0001-4d5e-8f00-0000000000a1')!
      expect(a1.orderedAt).toBe('2026-05-04T10:12:00Z') // frontend-first, passed through
      const [item] = a1.items
      expect(item).toMatchObject({
        capabilityVersion: 'c1a2b3c4-0001-4a3b-8c1d-00000000v101',
        variant: '4b242d05-b10b-4eba-8e2f-c7a899651ada',
        // joined from SystemInstance.orderItem, not from the OrderItem wire
        systemInstance: 'e8b9c1d2-3f4a-4b5c-6d7e-8f9a1b2c3d4e',
      })
      expect(item!.boundValues?.map((b) => [b.parameterId, b.value])).toEqual([
        ['5b6c7d8e-0001-4e5f-9a1b-00000000p101', '10 users'],
        ['5b6c7d8e-0001-4e5f-9a1b-00000000p102', 'Germany'],
      ])
    })

    it('leaves unfulfilled order items without a systemInstance', async () => {
      const a2 = await fetchOrderById('0a1b2c3d-0001-4d5e-8f00-0000000000a2')
      expect(a2.items.every((i) => !i.systemInstance)).toBe(true)
    })

    it('falls back to the bound value name for an unknown valid value', async () => {
      const a4 = await fetchOrderById('0a1b2c3d-0001-4d5e-8f00-0000000000a4')
      expect(a4.items[0]!.boundValues?.[0]?.value).toBe('port 8080-8090')
    })
  },
)

describe('FullListResponse true and false decode identically', () => {
  it.each([
    ['capabilities', fetchCapabilities],
    ['parameters', fetchParameters],
    ['orders', fetchOrders],
  ] as const)('%s', async (_, fetchAll) => {
    serve(true)
    const full = await fetchAll()
    serve(false)
    const refs = await fetchAll()
    expect(refs).toEqual(full)
  })
})

describe('strict lists (makeResourceApi)', () => {
  it('rejects a capability list item without any id', async () => {
    getJsonMock.mockImplementation(async (path: string) => {
      if (path === API.CAPABILITIES.list) return [{ displayName: 'no id' }]
      return []
    })
    await expect(fetchCapabilities()).rejects.toBeInstanceOf(ApiValidationError)
  })

  it('rejects a non-array list response', async () => {
    getJsonMock.mockImplementation(async (path: string) => {
      if (path === API.CAPABILITIES.list) return { items: [] }
      return []
    })
    await expect(fetchCapabilities()).rejects.toBeInstanceOf(ApiValidationError)
  })
})
