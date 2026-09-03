import { describe, it, expect } from 'vitest'
import { buildPaletteResults, PALETTE_GROUP_CAP, type PaletteSourceItem } from '@/utils/palette'

function item(id: string, type: PaletteSourceItem['type'], over: Partial<PaletteSourceItem> = {}) {
  return { id, type, label: id, ...over }
}

describe('buildPaletteResults', () => {
  it('matches label, id, description and annotations, case-insensitively', () => {
    const source = [
      item('s1', 'System', { label: 'Kong Gateway' }),
      item('s2', 'System', { label: 'Grafana', description: 'dashboards for kong metrics' }),
      item('c1', 'Component', {
        label: 'Prometheus',
        annotations: { 'emeland.io/owner-identities': 'Kong-Team' },
      }),
      item('a1', 'API', { label: 'Public Gateway' }),
    ]
    const byLabel = buildPaletteResults('kong', source)
    expect(byLabel.find((g) => g.type === 'System')!.items.map((i) => i.id)).toEqual(['s2', 's1'])
    expect(byLabel.find((g) => g.type === 'Component')!.items[0].id).toBe('c1')
    expect(byLabel.find((g) => g.type === 'API')).toBeUndefined()
  })

  it('returns nothing for an empty query', () => {
    expect(buildPaletteResults('  ', [item('s1', 'System')])).toEqual([])
  })

  it('groups in the fixed order and sorts items by label', () => {
    const source = [
      item('n1', 'Node', { label: 'bbb' }),
      item('f1', 'Finding', { label: 'bbb' }),
      item('s1', 'System', { label: 'bbb' }),
      item('n2', 'Node', { label: 'aab' }),
    ]
    const groups = buildPaletteResults('b', source)
    expect(groups.map((g) => g.type)).toEqual(['Finding', 'System', 'Node'])
    const nodes = groups.find((g) => g.type === 'Node')!
    expect(nodes.items.map((i) => i.label)).toEqual(['aab', 'bbb'])
  })

  it('caps per group and reports the total before the cap', () => {
    const source = Array.from({ length: PALETTE_GROUP_CAP + 3 }, (_, i) =>
      item(`f${i}`, 'Finding', { label: 'match me' }),
    )
    const groups = buildPaletteResults('match', source)
    expect(groups[0].items).toHaveLength(PALETTE_GROUP_CAP)
    expect(groups[0].total).toBe(PALETTE_GROUP_CAP + 3)
  })
})
