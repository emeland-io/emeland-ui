import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import InstanceCountBadge from '@/components/list/InstanceCountBadge.vue'

describe('InstanceCountBadge', () => {
  it('renders nothing at zero', () => {
    const w = mount(InstanceCountBadge, { props: { count: 0 } })
    expect(w.find('span').exists()).toBe(false)
  })

  it('shows the plain count with a pluralised title', () => {
    const w = mount(InstanceCountBadge, { props: { count: 3, noun: 'metric instance' } })
    expect(w.text()).toBe('3')
    expect(w.attributes('title')).toBe('3 metric instances')
    expect(w.find('.text-warning').exists()).toBe(false)
  })

  it('shows a tinted breached/total ratio when instances are over limit', () => {
    const w = mount(InstanceCountBadge, {
      props: { count: 3, breached: 1, noun: 'metric instance', glyph: 'metric' },
    })
    expect(w.text()).toBe('1/3')
    expect(w.find('.text-warning').text()).toBe('1')
    expect(w.attributes('title')).toBe(
      '3 metric instances, 1 over limit (derived from current values)',
    )
  })
})
