import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import YamlEditorView from '@/views/YamlEditorView.vue'
import { loadPersistedBundle, persistBundle } from '@/editor/document'
import { blankDocument } from '@/editor/kinds'

function fakeStorage(): Storage {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v)
    },
    removeItem: (k: string) => {
      map.delete(k)
    },
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size
    },
  } as Storage
}

describe('YamlEditorView bundle', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', fakeStorage())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('adds the active document to the bundle', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: YamlEditorView }],
    })
    await router.push('/')
    await router.isReady()

    const wrapper = mount(YamlEditorView, {
      global: { plugins: [router] },
    })

    const addBtn = wrapper.findAll('button').find((b) => b.text().includes('Add to bundle'))
    expect(addBtn).toBeTruthy()
    expect(addBtn!.attributes('disabled')).toBeUndefined()

    await addBtn!.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Bundle')
    expect(wrapper.text()).toMatch(/\(1\)/)
    expect(wrapper.text()).not.toContain('No documents yet')
    expect(loadPersistedBundle()).toHaveLength(1)
  })

  it('restores the bundle from localStorage on mount', async () => {
    const doc = blankDocument('System')
    doc.spec.displayName = 'Persisted'
    persistBundle([{ id: 'row-1', document: doc }])

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: YamlEditorView }],
    })
    await router.push('/')
    await router.isReady()

    const wrapper = mount(YamlEditorView, {
      global: { plugins: [router] },
    })

    expect(wrapper.text()).toContain('Persisted')
    expect(wrapper.text()).toMatch(/\(1\)/)
  })

  it('clears the bundle with Remove all', async () => {
    const doc = blankDocument('System')
    doc.spec.displayName = 'Gone'
    persistBundle([{ id: 'row-1', document: doc }])

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: YamlEditorView }],
    })
    await router.push('/')
    await router.isReady()

    const wrapper = mount(YamlEditorView, {
      global: { plugins: [router] },
    })

    const clearBtn = wrapper.findAll('button').find((b) => b.text().includes('Remove all'))
    expect(clearBtn).toBeTruthy()
    await clearBtn!.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('No documents yet')
    expect(loadPersistedBundle()).toHaveLength(0)
  })

  it('filters resource types by search', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: YamlEditorView }],
    })
    await router.push('/')
    await router.isReady()

    const wrapper = mount(YamlEditorView, {
      global: { plugins: [router] },
    })

    const nav = wrapper.find('nav[aria-label="Resource types"]')
    expect(nav.text()).toContain('System')
    expect(nav.text()).toContain('Metric')

    const input = wrapper.find('input[data-search-input]')
    await input.setValue('metric')
    await wrapper.vm.$nextTick()

    expect(nav.text()).toContain('Metric')
    expect(nav.text()).not.toContain('System')
  })
})
