import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import FindingCard from '@/components/detail/FindingCard.vue'
import type { Finding } from '@/types/finding'

const FINDING: Finding = {
  findingId: 'f-1',
  displayName: 'Latency objective missed',
  findingType: { findingTypeId: 'ft-1', displayName: 'ThresholdBreached' },
  resources: [],
  annotations: {},
}

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('FindingCard', () => {
  it('shows kind, name and id', () => {
    const w = mount(FindingCard, { props: { finding: FINDING } })
    expect(w.text()).toContain('ThresholdBreached')
    expect(w.text()).toContain('Latency objective missed')
    expect(w.text()).toContain('f-1')
    expect(w.find('[title^="on "]').exists()).toBe(false)
  })

  it('shows the note when given and emits open on click', async () => {
    const w = mount(FindingCard, { props: { finding: FINDING, note: 'on orders-api' } })
    expect(w.find('[title="on orders-api"]').text()).toBe('on orders-api')
    await w.trigger('click')
    expect(w.emitted('open')).toEqual([['f-1']])
  })
})
