import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import YamlEditorView from '@/views/YamlEditorView.vue'

describe('YamlEditorView bundle', () => {
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
  })
})
