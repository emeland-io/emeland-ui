import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import InstanceStrip from '@/components/metrics/InstanceStrip.vue'
import type { StripPoint } from '@/components/metrics/InstanceStrip.vue'

const POINTS: StripPoint[] = [
  { id: 'a', name: 'App Backend', value: '91', n: 91, breached: true },
  { id: 'b', name: 'Kong Gateway', value: '34', n: 34, breached: false },
  { id: 'c', name: 'Grafana', value: '12', n: 12, breached: false },
]

describe('InstanceStrip', () => {
  it('renders nothing for a single point', () => {
    const w = mount(InstanceStrip, { props: { points: POINTS.slice(0, 1), unit: '%' } })
    expect(w.find('[data-instance-strip]').exists()).toBe(false)
  })

  it('places a marker per instance on a shared percent scale', () => {
    const w = mount(InstanceStrip, { props: { points: POINTS, unit: '%', activeId: 'b' } })
    const byTitle = (prefix: string) =>
      w.findAll('[data-strip-marker]').find((m) => m.attributes('title')?.startsWith(prefix))!
    expect(byTitle('App Backend').attributes('style')).toContain('left: 91%')
    expect(byTitle('App Backend').attributes('title')).toBe('App Backend: 91 %')
    expect(byTitle('App Backend').find('.bg-warning').exists()).toBe(true)
    expect(byTitle('Kong Gateway').classes()).toContain('ring-accent')
    expect(byTitle('Grafana').classes()).toContain('ring-bg-0')
    expect(w.text()).toContain('0')
    expect(w.text()).toContain('100 %')
  })

  it('paints breached markers last and emits select on click', async () => {
    const w = mount(InstanceStrip, { props: { points: POINTS, unit: '%' } })
    const markers = w.findAll('[data-strip-marker]')
    expect(markers.at(-1)!.attributes('title')).toBe('App Backend: 91 %')
    await markers.at(-1)!.trigger('click')
    expect(w.emitted('select')).toEqual([['a']])
  })
})
