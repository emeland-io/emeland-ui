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
      annotations: {
        'emeland.io/threshold.operator': side === 'above' ? 'ge' : 'lt',
        'emeland.io/threshold.limit': `${n}`,
      },
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

function markerOf(w: ReturnType<typeof mount>, prefix: string) {
  return w.findAll('[data-strip-marker]').find((m) => m.attributes('title')?.startsWith(prefix))!
}

describe('InstanceStrip', () => {
  it('renders nothing for a single point', () => {
    const w = mount(InstanceStrip, { props: { points: POINTS.slice(0, 1), unit: '%' } })
    expect(w.find('[data-instance-strip]').exists()).toBe(false)
  })

  it('places a marker per instance on a shared percent scale', () => {
    const w = mount(InstanceStrip, { props: { points: POINTS, unit: '%', activeId: 'b' } })
    expect(markerOf(w, 'App Backend').attributes('style')).toContain('left: 91%')
    expect(markerOf(w, 'App Backend').attributes('title')).toBe('App Backend: 91 %')
    expect(markerOf(w, 'App Backend').find('.bg-warning').exists()).toBe(true)
    expect(markerOf(w, 'Kong Gateway').classes()).toContain('ring-accent')
    expect(markerOf(w, 'Grafana').classes()).toContain('ring-bg-0')
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
    expect(w.findAll('[data-strip-band]')).toHaveLength(0)
  })

  it('reports the marker under the pointer and clears it on leave', async () => {
    const w = mount(InstanceStrip, { props: { points: POINTS, unit: '%' } })
    const kong = markerOf(w, 'Kong')
    await kong.trigger('mouseenter')
    await kong.trigger('mouseleave')
    expect(w.emitted('highlight')).toEqual([['b'], ['']])
  })

  it("emphasises the highlighted instance's marker, ticks and bands and dims the rest", () => {
    const w = mount(InstanceStrip, { props: { points: POINTS, unit: '%', highlightId: 'b' } })
    const bands = w.findAll('[data-strip-band]')
    expect(bands).toHaveLength(1)
    expect(bands[0]!.attributes('style')).toContain('left: 85%')
    expect(bands[0]!.attributes('style')).toContain('right: 0')
    expect(bands[0]!.attributes('title')).toBe('≥ 85 % b-warn name')
    const ticks = w.findAll('[data-strip-tick]')
    expect(ticks[0]!.classes()).toContain('bg-warning')
    expect(ticks[1]!.classes()).toContain('bg-warning/15')
    expect(markerOf(w, 'Kong').classes()).toContain('ring-accent/60')
    expect(markerOf(w, 'App Backend').classes()).toContain('opacity-30')
    // the highlighted marker paints on top
    expect(w.findAll('[data-strip-marker]').at(-1)!.attributes('title')).toContain('Kong')
    // connector from the reading (34) to its limit (85), capped at the limit
    const link = w.find('[data-strip-link]')
    expect(link.attributes('style')).toContain('left: 34%')
    expect(link.attributes('style')).toContain('width: 51%')
    expect(link.classes()).toContain('border-dashed')
    expect(link.classes()).toContain('border-text-3')
    expect(w.find('[data-strip-cap]').attributes('style')).toContain('left: 85%')
  })

  it('draws a solid connector once the reading is past the limit', () => {
    const w = mount(InstanceStrip, { props: { points: POINTS, unit: '%', highlightId: 'a' } })
    const links = w.findAll('[data-strip-link]')
    expect(links).toHaveLength(2)
    expect(links[0]!.classes()).toContain('border-solid')
    expect(links[0]!.classes()).toContain('border-warning')
    expect(links[0]!.attributes('style')).toContain('width: 6%')
    expect(links[1]!.classes()).toContain('border-dashed')
    expect(links[1]!.attributes('style')).toContain('width: 4%')
  })

  it('puts a below-limit band on the low side and widens the domain to the limit', () => {
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
    const w = mount(InstanceStrip, { props: { points, unit: 'days', highlightId: 'x' } })
    expect(w.text()).toContain('44 days')
    const band = w.find('[data-strip-band]')
    expect(band.attributes('style')).toContain('left: 0')
    expect(band.attributes('style')).toMatch(/right: 31\.8\d*%/)
  })
})
