import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import InstanceStrip from '@/components/metrics/InstanceStrip.vue'
import type { StripPoint } from '@/components/metrics/InstanceStrip.vue'
import type { ThresholdLimit } from '@/types/metric'

function limit(id: string, n: number, side: 'above' | 'below', label: string): ThresholdLimit {
  return {
    threshold: {
      thresholdId: id,
      displayName: `${id} name`,
      metricInstanceId: 'i',
      annotations: {},
    },
    limit: n,
    side,
    label,
  }
}

const POINTS: StripPoint[] = [
  {
    id: 'a',
    name: 'App Backend',
    value: '91',
    n: 91,
    breached: true,
    limits: [limit('a-warn', 85, 'above', '≥ 85 %'), limit('a-crit', 95, 'above', '≥ 95 %')],
  },
  {
    id: 'b',
    name: 'Kong Gateway',
    value: '34',
    n: 34,
    breached: false,
    limits: [limit('b-warn', 85, 'above', '≥ 85 %')],
  },
  { id: 'c', name: 'Grafana', value: '12', n: 12, breached: false, limits: [] },
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

  it('draws one tick per distinct limit, naming everyone at it', () => {
    const w = mount(InstanceStrip, { props: { points: POINTS, unit: '%' } })
    const ticks = w.findAll('[data-strip-tick]')
    expect(ticks).toHaveLength(2)
    expect(ticks[0]!.attributes('style')).toContain('left: 85%')
    expect(ticks[0]!.attributes('title')).toBe('App Backend: ≥ 85 %\nKong Gateway: ≥ 85 %')
    expect(ticks[1]!.attributes('title')).toBe('App Backend: ≥ 95 %')
  })

  it("shows the hovered instance's own bands only while hovered", async () => {
    const w = mount(InstanceStrip, { props: { points: POINTS, unit: '%' } })
    expect(w.findAll('[data-strip-band]')).toHaveLength(0)
    const kong = w
      .findAll('[data-strip-marker]')
      .find((m) => m.attributes('title')?.startsWith('Kong'))!
    await kong.trigger('mouseenter')
    const bands = w.findAll('[data-strip-band]')
    expect(bands).toHaveLength(1)
    expect(bands[0]!.attributes('style')).toContain('left: 85%')
    expect(bands[0]!.attributes('style')).toContain('right: 0')
    expect(bands[0]!.attributes('title')).toBe('≥ 85 % b-warn name')
    await kong.trigger('mouseleave')
    expect(w.findAll('[data-strip-band]')).toHaveLength(0)
  })

  it('puts a below-limit band on the low side and widens the domain to the limit', async () => {
    const points: StripPoint[] = [
      {
        id: 'x',
        name: 'X',
        value: '12',
        n: 12,
        breached: true,
        limits: [limit('x', 30, 'below', '< 30 days')],
      },
      {
        id: 'y',
        name: 'Y',
        value: '40',
        n: 40,
        breached: false,
        limits: [limit('y', 30, 'below', '< 30 days')],
      },
    ]
    const w = mount(InstanceStrip, { props: { points, unit: 'days' } })
    expect(w.text()).toContain('44 days')
    await w.find('[data-strip-marker]').trigger('focus')
    const band = w.find('[data-strip-band]')
    expect(band.attributes('style')).toContain('left: 0')
    expect(band.attributes('style')).toMatch(/right: 31\.8\d*%/)
  })
})
