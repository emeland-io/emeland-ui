import { describe, it, expect } from 'vitest'
import { groupByBrokenRef } from '@/utils/mapping'

describe('groupByBrokenRef', () => {
  it('groups by reference, truncating unresolvable ids, no-reference group last', () => {
    const items = [
      { id: 'a', ref: 'ffffffff-1111-4000-8000-000000000001' },
      { id: 'b', ref: undefined },
      { id: 'c', ref: 'eeeeeeee-2222-4000-8000-000000000002' },
      { id: 'd', ref: 'ffffffff-1111-4000-8000-000000000001' },
    ]
    const groups = groupByBrokenRef(items, (i) => i.ref, 'No reference')

    expect(groups.map((g) => g.key)).toEqual([
      'eeeeeeee-2222-4000-8000-000000000002',
      'ffffffff-1111-4000-8000-000000000001',
      '',
    ])
    expect(groups[0].label).toBe('eeeeeeee…')
    expect(groups[0].state).toBe('unresolved')
    expect(groups[1].items.map((i) => i.id)).toEqual(['a', 'd'])
    expect(groups[2].label).toBe('No reference')
    expect(groups[2].state).toBe('unmapped')
  })

  it('resolves labels via labelOf and clears the state when the reference exists', () => {
    const known = new Map([['si-1', 'Kong (prod-eu)']])
    const items = [
      { id: 'a', ref: 'si-1' },
      { id: 'b', ref: 'si-missing' },
      { id: 'c', ref: undefined },
    ]
    const groups = groupByBrokenRef(
      items,
      (i) => i.ref,
      'No system instance',
      (key) => known.get(key),
      (key) => known.has(key),
    )

    const resolved = groups.find((g) => g.key === 'si-1')!
    expect(resolved.label).toBe('Kong (prod-eu)')
    expect(resolved.state).toBeUndefined()

    const broken = groups.find((g) => g.key === 'si-missing')!
    expect(broken.label).toBe('si-missi…')
    expect(broken.state).toBe('unresolved')

    // the no-reference group still sorts last
    expect(groups.at(-1)!.key).toBe('')
  })
})
