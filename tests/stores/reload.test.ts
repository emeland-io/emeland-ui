import { describe, it, expect, vi } from 'vitest'
import { createResourceCollection } from '@/stores/resourceCollection'

interface Widget {
  id: string
  displayName: string
  version?: string
}

function makeWidget(id: string, version = 'v1'): Widget {
  return { id, displayName: id, version }
}

function makeCollection() {
  const fetchAll = vi.fn(async () => [makeWidget('w1'), makeWidget('w2')])
  const fetchById = vi.fn(async (id: string) => makeWidget(id, 'v2'))
  const instFetchAll = vi.fn(async () => [{ iid: 'i1', widget: 'w1' }])
  const instFetchById = vi.fn(async (id: string) => ({ iid: id, widget: 'w1' }))
  const typeFetchAll = vi.fn(async () => [{ tid: 't1' }])
  const typeFetchById = vi.fn(async (id: string) => ({ tid: id }))

  const res = createResourceCollection<Widget, { iid: string; widget: string }, { tid: string }>({
    idOf: (w) => w.id,
    fetchAll,
    fetchById,
    instances: {
      idOf: (i) => i.iid,
      parentOf: (i) => i.widget,
      fetchAll: instFetchAll,
      fetchById: instFetchById,
    },
    types: { idOf: (t) => t.tid, fetchAll: typeFetchAll, fetchById: typeFetchById },
  })
  return { res, fetchAll, fetchById, instFetchAll, typeFetchAll }
}

describe('createResourceCollection.reload', () => {
  it('refetches the list and clears the load-once guard', async () => {
    const { res, fetchAll } = makeCollection()
    await res.load()
    expect(fetchAll).toHaveBeenCalledTimes(1)
    await res.load() // load-once: no second fetch
    expect(fetchAll).toHaveBeenCalledTimes(1)

    await res.reload()
    expect(fetchAll).toHaveBeenCalledTimes(2)
  })

  it('rehydrates details (hydration guard reset)', async () => {
    const { res, fetchById } = makeCollection()
    await res.load()
    await res.loadDetail('w1')
    expect(fetchById).toHaveBeenCalledTimes(1)
    expect(res.items.value[0].version).toBe('v2')

    fetchById.mockImplementation(async (id) => makeWidget(id, 'v3'))
    await res.loadDetail('w1') // hydrated: no refetch
    expect(fetchById).toHaveBeenCalledTimes(1)

    await res.reload()
    expect(res.items.value[0].version).toBe('v3')
  })

  it('refreshes instances and types too', async () => {
    const { res, instFetchAll, typeFetchAll } = makeCollection()
    await res.load()
    await res.instances.load()
    await res.types.load()
    expect(instFetchAll).toHaveBeenCalledTimes(1)
    expect(typeFetchAll).toHaveBeenCalledTimes(1)

    await res.reload()
    expect(instFetchAll).toHaveBeenCalledTimes(2)
    expect(typeFetchAll).toHaveBeenCalledTimes(2)
  })

  it('clears a previous list error via resetError', async () => {
    const { res, fetchAll } = makeCollection()
    fetchAll.mockRejectedValueOnce(new Error('boom'))
    await res.load()
    expect(res.error.value).toBe('boom')

    await res.reload()
    expect(res.error.value).toBeNull()
    expect(res.loaded.value).toBe(true)
  })

  it('keeps current items visible while reloading', async () => {
    const { res, fetchAll } = makeCollection()
    await res.load()
    fetchAll.mockImplementation(async () => {
      // while the reload fetch is in flight, the old items must still be there
      expect(res.items.value).toHaveLength(2)
      return [makeWidget('w1'), makeWidget('w2'), makeWidget('w3')]
    })
    await res.reload()
    expect(res.items.value).toHaveLength(3)
  })
})
