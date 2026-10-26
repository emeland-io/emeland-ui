import { describe, it, expect, vi } from 'vitest'
import { h, nextTick, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { useQueryTarget, useResourceNav } from '@/composables/useResourceNav'

const Empty = { render: () => h('div') }

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: ['Findings', 'Systems', 'Metrics', 'Nodes'].map((name) => ({
      name,
      path: `/${name.toLowerCase()}`,
      component: Empty,
    })),
  })
}

async function mountWith(router: ReturnType<typeof makeRouter>, setup: () => unknown) {
  // a memory router is only ready after its first navigation
  if (router.currentRoute.value.matched.length === 0) await router.push({ name: 'Findings' })
  await router.isReady()
  return mount(
    {
      setup() {
        setup()
        return () => h('div')
      },
    },
    { global: { plugins: [router] } },
  )
}

describe('useResourceNav', () => {
  it('selects a listed resource, opens an instance or a type by its own query key', async () => {
    const router = makeRouter()
    let nav!: ReturnType<typeof useResourceNav>
    await mountWith(router, () => {
      nav = useResourceNav()
    })
    const push = vi.spyOn(router, 'push')

    nav.goToResource('System', 's1')
    expect(push).toHaveBeenLastCalledWith({ name: 'Systems', query: { select: 's1' } })
    nav.goToResource('SystemInstance', 'i1')
    expect(push).toHaveBeenLastCalledWith({ name: 'Systems', query: { instance: 'i1' } })
    nav.goToResource('MetricInstance', 'mi1')
    expect(push).toHaveBeenLastCalledWith({ name: 'Metrics', query: { instance: 'mi1' } })
    nav.goToResource('NodeType', 'nt1')
    expect(push).toHaveBeenLastCalledWith({ name: 'Nodes', query: { type: 'nt1' } })
    nav.goToFinding('f1')
    expect(push).toHaveBeenLastCalledWith({ name: 'Findings', query: { select: 'f1' } })
  })

  it('ignores resources without a view', async () => {
    const router = makeRouter()
    let nav!: ReturnType<typeof useResourceNav>
    await mountWith(router, () => {
      nav = useResourceNav()
    })
    const push = vi.spyOn(router, 'push')
    nav.goToResource('Threshold', 't1')
    expect(push).not.toHaveBeenCalled()
  })

  it('keeps the current view query but drops a stale target when staying on the view', async () => {
    const router = makeRouter()
    await router.push({ name: 'Systems', query: { view: 'graph', select: 'old' } })
    const push = vi.spyOn(router, 'push')
    let nav!: ReturnType<typeof useResourceNav>
    await mountWith(router, () => {
      nav = useResourceNav()
    })
    nav.goToResource('SystemInstance', 'i1')
    expect(push).toHaveBeenLastCalledWith({
      name: 'Systems',
      query: { view: 'graph', instance: 'i1' },
    })
  })
})

describe('useQueryTarget', () => {
  it('waits until the target is loaded, acts once and strips the key', async () => {
    const router = makeRouter()
    await router.push({ name: 'Systems', query: { instance: 'i1', view: 'graph' } })
    const loaded = ref<string[]>([])
    const handle = vi.fn()
    await mountWith(router, () => {
      useQueryTarget('instance', (id) => loaded.value.includes(id), handle)
    })
    expect(handle).not.toHaveBeenCalled()

    loaded.value = ['i1']
    await nextTick()
    expect(handle).toHaveBeenCalledTimes(1)
    expect(handle).toHaveBeenCalledWith('i1')

    await flushPromises()
    expect(router.currentRoute.value.query).toEqual({ view: 'graph' })
  })

  it('acts again when the same target is requested a second time', async () => {
    const router = makeRouter()
    await router.push({ name: 'Nodes', query: { type: 'nt1' } })
    const handle = vi.fn()
    await mountWith(router, () => {
      useQueryTarget('type', () => true, handle)
    })
    expect(handle).toHaveBeenCalledTimes(1)
    await flushPromises()
    expect(router.currentRoute.value.query).toEqual({})

    await router.push({ name: 'Nodes', query: { type: 'nt1' } })
    await nextTick()
    expect(handle).toHaveBeenCalledTimes(2)
  })
})
