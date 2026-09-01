import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ResourceViewShell from '@/components/view/ResourceViewShell.vue'
import ListDetailSkeleton from '@/components/view/ListDetailSkeleton.vue'
import SkeletonShell from '@/components/view/SkeletonShell.vue'
import SkeletonBlock from '@/components/view/SkeletonBlock.vue'
import GraphPaneSkeleton from '@/components/graph/GraphPaneSkeleton.vue'

function mountShell(props: Partial<InstanceType<typeof ResourceViewShell>['$props']> = {}) {
  return mount(ResourceViewShell, {
    props: {
      loading: false,
      loadingLabel: 'Loading things...',
      error: null,
      errorListEmpty: false,
      ...props,
    },
    slots: { default: '<div data-test="content">loaded</div>' },
  })
}

describe('ResourceViewShell skeleton gate', () => {
  it('renders the default skeleton instead of content while loading', () => {
    const w = mountShell({ loading: true })
    expect(w.findComponent(ListDetailSkeleton).exists()).toBe(true)
    expect(w.find('[data-test="content"]').exists()).toBe(false)
    const status = w.find('[role="status"]')
    expect(status.attributes('aria-label')).toBe('Loading things...')
  })

  it('renders the content once loading is done', () => {
    const w = mountShell()
    expect(w.findComponent(ListDetailSkeleton).exists()).toBe(false)
    expect(w.find('[data-test="content"]').exists()).toBe(true)
  })

  it('a view can supply its own skeleton via the slot', () => {
    const w = mount(ResourceViewShell, {
      props: { loading: true, loadingLabel: 'l', error: null, errorListEmpty: false },
      slots: { skeleton: '<div data-test="custom-skeleton" />' },
    })
    expect(w.find('[data-test="custom-skeleton"]').exists()).toBe(true)
    expect(w.findComponent(ListDetailSkeleton).exists()).toBe(false)
  })
})

describe('ListDetailSkeleton', () => {
  it('mirrors the list/detail layout with the requested row count', () => {
    const w = mount(ListDetailSkeleton, { props: { rows: 3, listWidth: 200 } })
    expect(w.findAllComponents(SkeletonBlock).length).toBeGreaterThan(3)
    expect(w.html()).toContain('width: 200px')
  })

  it('omits the toolbar strip when disabled', () => {
    const withBar = mount(ListDetailSkeleton)
    const without = mount(ListDetailSkeleton, { props: { toolbar: false } })
    expect(without.findAllComponents(SkeletonBlock).length).toBeLessThan(
      withBar.findAllComponents(SkeletonBlock).length,
    )
  })
})

describe('GraphPaneSkeleton', () => {
  it('renders node-shaped blocks and a centered label as a status region', () => {
    const w = mount(GraphPaneSkeleton)
    expect(w.attributes('role')).toBe('status')
    expect(w.attributes('aria-label')).toBe('Loading graph...')
    expect(w.findAllComponents(SkeletonBlock).length).toBeGreaterThan(3)
    expect(w.text()).toContain('Loading graph...')
  })
})

describe('SkeletonShell wrapper', () => {
  it('marks the region as status with the given label', () => {
    const w = mount(SkeletonShell, {
      props: { label: 'Loading model...' },
      slots: { default: '<div />' },
    })
    expect(w.attributes('role')).toBe('status')
    expect(w.attributes('aria-label')).toBe('Loading model...')
    expect(w.classes()).toContain('skeleton-appear')
  })
})

describe('SkeletonBlock', () => {
  it('is an animated, aria-hidden placeholder', () => {
    const w = mount(SkeletonBlock)
    expect(w.classes()).toContain('animate-pulse')
    expect(w.attributes('aria-hidden')).toBe('true')
  })
})
