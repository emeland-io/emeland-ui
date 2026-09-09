import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import SettingsAnnotationsView from '@/views/SettingsAnnotationsView.vue'
import SettingsView from '@/views/SettingsView.vue'
import { WELL_KNOWN_ANNOTATIONS } from '@/utils/annotations'

beforeEach(() => setActivePinia(createPinia()))

describe('SettingsAnnotationsView', () => {
  it('renders one section per registry category', () => {
    const w = mount(SettingsAnnotationsView)
    const categories = [...new Set(WELL_KNOWN_ANNOTATIONS.map((d) => d.category))]
    for (const category of categories) {
      expect(w.text()).toContain(category)
    }
  })

  it('applies alphabetical order within each category', () => {
    const w = mount(SettingsAnnotationsView)
    const sections = w.findAll('section')
    expect(sections.length).toBeGreaterThan(1)
  })

  it('shows full emeland.io/ keys, purpose, example and a copy button per entry', () => {
    const w = mount(SettingsAnnotationsView)
    const text = w.text()
    expect(text).toContain('emeland.io/endpoint.host')
    for (const def of WELL_KNOWN_ANNOTATIONS) {
      expect(text).toContain(def.purpose)
    }
    const copyButtons = w.findAll('[aria-label="Copy to clipboard"]')
    expect(copyButtons.length).toBe(WELL_KNOWN_ANNOTATIONS.length)
  })

  it('filters the catalog via the toolbar search', async () => {
    const w = mount(SettingsAnnotationsView)
    const input = w.find('input[data-search-input]')
    await input.setValue('endpoint')
    const sections = w.findAll('section')
    expect(sections).toHaveLength(1)
    expect(sections[0].text()).toContain('Endpoint')
    await input.setValue('no-such-key-exists')
    expect(w.text()).toContain('No annotations')
  })
})

describe('SettingsView shell', () => {
  it('renders the settings sub-navigation', () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
    })
    const w = mount(SettingsView, {
      global: {
        plugins: [router],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })
    expect(w.text()).toContain('General')
    expect(w.text()).toContain('Annotations')
  })
})
