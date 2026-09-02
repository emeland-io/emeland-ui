import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createResourceCollection } from '@/stores/resourceCollection'
import { useToasts } from '@/composables/useToasts'

interface Item {
  id: string
  name: string
  full?: boolean
}
interface Inst {
  id: string
  parent: string
  full?: boolean
}

function deferred<T>() {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const LIST: Item[] = [
  { id: 'a', name: 'A' },
  { id: 'b', name: 'B' },
]

function makeCollection(overrides: {
  fetchById?: (id: string) => Promise<Item>
  mergeDetail?: (full: Item, id: string) => Item
  instances?: Parameters<typeof createResourceCollection<Item, Inst>>[0]['instances']
  types?: Parameters<typeof createResourceCollection<Item, Inst, Item>>[0]['types']
}) {
  return createResourceCollection<Item, Inst, Item>({
    idOf: (i) => i.id,
    fetchAll: async () => [...LIST],
    fetchById: overrides.fetchById ?? (async (id) => ({ id, name: id.toUpperCase(), full: true })),
    mergeDetail: overrides.mergeDetail,
    instances: overrides.instances,
    types: overrides.types,
  })
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const { toasts, dismiss } = useToasts()
  for (const t of [...toasts.value]) dismiss(t.id)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('createResourceCollection load', () => {
  it('records a failed list load and stays retryable', async () => {
    const fetchAll = vi
      .fn<() => Promise<Item[]>>()
      .mockRejectedValueOnce(new Error('list down'))
      .mockResolvedValueOnce([...LIST])
    const coll = createResourceCollection<Item>({
      idOf: (i) => i.id,
      fetchAll,
      fetchById: async (id) => ({ id, name: id }),
    })

    await coll.load()
    expect(coll.error.value).toBe('list down')
    expect(coll.loaded.value).toBe(false)
    expect(coll.loading.value).toBe(false)

    // a failed load must not trip the load-once guard
    await coll.load()
    expect(coll.error.value).toBeNull()
    expect(coll.loaded.value).toBe(true)
    expect(coll.items.value).toHaveLength(LIST.length)
  })
})

describe('createResourceCollection detail hydration', () => {
  it('deduplicates concurrent loadDetail calls onto one in-flight fetch', async () => {
    const d = deferred<Item>()
    const fetchById = vi.fn(() => d.promise)
    const coll = makeCollection({ fetchById })
    await coll.load()

    const first = coll.loadDetail('a')
    const second = coll.loadDetail('a')
    expect(fetchById).toHaveBeenCalledTimes(1)

    d.resolve({ id: 'a', name: 'A full', full: true })
    await Promise.all([first, second])
    expect(coll.map.value.get('a')?.full).toBe(true)
  })

  it('does not refetch hydrated ids', async () => {
    const fetchById = vi.fn(async (id: string) => ({ id, name: id, full: true }))
    const coll = makeCollection({ fetchById })
    await coll.load()

    await coll.loadDetail('a')
    await coll.loadDetail('a')
    expect(fetchById).toHaveBeenCalledTimes(1)
  })

  it('a failed detail is recorded, keeps the list item, and can be retried', async () => {
    const fetchById = vi
      .fn<(id: string) => Promise<Item>>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({ id: 'a', name: 'A full', full: true })
    const coll = makeCollection({ fetchById })
    await coll.load()

    await coll.loadDetail('a')
    expect(coll.hasDetailError('a')).toBe(true)
    expect(coll.detailErrorMessage('a')).toBe('boom')
    expect(coll.map.value.get('a')?.name).toBe('A')

    // the failure must not mark the id hydrated — a retry refetches and clears
    await coll.loadDetail('a')
    expect(fetchById).toHaveBeenCalledTimes(2)
    expect(coll.hasDetailError('a')).toBe(false)
    expect(coll.map.value.get('a')?.full).toBe(true)
  })

  it('applies mergeDetail before replacing the list item', async () => {
    const coll = makeCollection({
      fetchById: async () => ({ id: '', name: 'no id in payload', full: true }),
      mergeDetail: (full, id) => ({ ...full, id }),
    })
    await coll.load()

    await coll.loadDetail('b')
    expect(coll.map.value.get('b')).toEqual({ id: 'b', name: 'no id in payload', full: true })
  })

  it('loadAllDetails hydrates every item once and flips detailsHydrated', async () => {
    const fetchById = vi.fn(async (id: string) => ({ id, name: id, full: true }))
    const coll = makeCollection({ fetchById })
    await coll.load()

    await coll.loadAllDetails()
    expect(fetchById).toHaveBeenCalledTimes(LIST.length)
    expect(coll.detailsHydrated.value).toBe(true)
    expect(coll.items.value.every((i) => i.full)).toBe(true)

    await coll.loadAllDetails()
    expect(fetchById).toHaveBeenCalledTimes(LIST.length)
  })
})

describe('createResourceCollection instances', () => {
  const INSTANCES: Inst[] = [
    { id: 'i1', parent: 'a' },
    { id: 'i2', parent: 'a' },
    { id: 'i3', parent: '' },
    { id: 'i4', parent: 'ghost' },
  ]

  function instanceOptions(fetchById?: (id: string) => Promise<Inst>) {
    return {
      idOf: (i: Inst) => i.id,
      parentOf: (i: Inst) => i.parent,
      fetchAll: async () => [...INSTANCES],
      fetchById: fetchById ?? (async (id: string) => ({ ...INSTANCES.find((i) => i.id === id)!, full: true })),
    }
  }

  it('hydrates each instance by id and groups them by parent', async () => {
    const coll = makeCollection({ instances: instanceOptions() })
    await coll.load()
    await coll.instances.load()

    expect(coll.instances.items.value).toHaveLength(4)
    expect(coll.instances.items.value.every((i) => i.full)).toBe(true)
    expect(coll.instances.getFor('a').map((i) => i.id)).toEqual(['i1', 'i2'])
    expect(coll.instances.getFor('b')).toEqual([])
    expect(coll.instances.map.value.get('i3')?.id).toBe('i3')
  })

  it('keeps an instance-list failure out of the parent error and toasts it', async () => {
    const opts = instanceOptions()
    opts.fetchAll = vi
      .fn<() => Promise<Inst[]>>()
      .mockRejectedValueOnce(new Error('instances down'))
      .mockResolvedValueOnce([...INSTANCES])
    const coll = makeCollection({ instances: opts })
    await coll.load()

    await coll.instances.load()
    expect(coll.instances.error.value).toBe('instances down')
    expect(coll.error.value).toBeNull()
    const { toasts } = useToasts()
    expect(
      toasts.value.some((t) => t.tone === 'error' && t.message.includes('instances down')),
    ).toBe(true)

    // failure must not trip the load-once guard, success clears the error
    await coll.instances.load()
    expect(coll.instances.error.value).toBeNull()
    expect(coll.instances.items.value).toHaveLength(INSTANCES.length)
  })

  it('collects instances with absent or unresolvable parents as unmapped', async () => {
    const coll = makeCollection({ instances: instanceOptions() })
    await coll.load()
    await coll.instances.load()

    expect(coll.instances.unmapped.value.map((i) => i.id)).toEqual(['i3', 'i4'])
  })

  it('keeps the minimal item on hydration failure, records it, and toasts once', async () => {
    const fetchById = vi.fn(async (id: string) => {
      if (id === 'i2' || id === 'i3') throw new Error(`no detail for ${id}`)
      return { ...INSTANCES.find((i) => i.id === id)!, full: true }
    })
    const coll = makeCollection({ instances: instanceOptions(fetchById) })
    await coll.load()
    await coll.instances.load()

    // failed hydrations fall back to the minimal list item
    expect(coll.instances.map.value.get('i2')).toEqual({ id: 'i2', parent: 'a' })
    expect(coll.errs.hasDetailError('i2')).toBe(true)
    expect(coll.errs.detailErrorMessage('i3')).toBe('no detail for i3')

    const { toasts } = useToasts()
    const bulk = toasts.value.filter((t) => t.message.includes('instance details failed'))
    expect(bulk).toHaveLength(1)
    expect(bulk[0]).toMatchObject({
      message: '2 of 4 instance details failed to load',
      tone: 'warning',
    })
  })
})

describe('createResourceCollection types', () => {
  const TYPES: Item[] = [{ id: 't1', name: 'Type one' }]

  it('loads the type list and a selected type detail', async () => {
    const coll = makeCollection({
      types: {
        idOf: (t) => t.id,
        fetchAll: async () => [...TYPES],
        fetchById: async (id) => ({ id, name: 'Type one', full: true }),
      },
    })

    await coll.types.load()
    expect(coll.types.map.value.get('t1')?.name).toBe('Type one')

    await coll.types.loadDetail('t1')
    expect(coll.types.selectedDetail.value?.full).toBe(true)
  })

  it('keeps a type-list failure out of the parent error and toasts it', async () => {
    const coll = makeCollection({
      types: {
        idOf: (t) => t.id,
        fetchAll: async () => {
          throw new Error('types down')
        },
        fetchById: async (id) => ({ id, name: id }),
      },
    })

    await coll.types.load()
    expect(coll.types.error.value).toBe('types down')
    expect(coll.error.value).toBeNull()
    const { toasts } = useToasts()
    expect(toasts.value.some((t) => t.tone === 'error' && t.message.includes('types down'))).toBe(
      true,
    )
  })

  it('clears the selected detail and toasts when the type detail fails', async () => {
    const coll = makeCollection({
      types: {
        idOf: (t) => t.id,
        fetchAll: async () => [...TYPES],
        fetchById: async () => {
          throw new Error('type gone')
        },
      },
    })

    await coll.types.loadDetail('t1')
    expect(coll.types.selectedDetail.value).toBeNull()
    const { toasts } = useToasts()
    expect(toasts.value.some((t) => t.tone === 'error' && t.message.includes('type gone'))).toBe(
      true,
    )
  })
})
