import { describe, it, expect, vi } from 'vitest'

vi.mock('@/api/fetch', () => ({
  USE_MOCKS: true,
  getJson: vi.fn(),
}))

import { fetchApis, fetchApiById, fetchApiInstances } from '@/api/apis'
import { fetchComponents, fetchComponentById, fetchComponentInstances } from '@/api/components'
import { fetchContexts, fetchContextById, fetchContextTypes } from '@/api/contexts'
import { fetchFindings, fetchFindingById, fetchFindingTypes } from '@/api/findings'
import { fetchNodes, fetchNodeById, fetchNodeTypes } from '@/api/nodes'
import { fetchSystems, fetchSystemById, fetchSystemInstances } from '@/api/systems'
import { fetchModel } from '@/api/model'
import { systems } from '@/mocks/systems'

describe('bundled mocks (validated on the mock path too)', () => {
  it('every list returns decoded domain objects', async () => {
    const lists: [string, () => Promise<unknown[]>][] = [
      ['systems', fetchSystems],
      ['system instances', fetchSystemInstances],
      ['apis', fetchApis],
      ['api instances', fetchApiInstances],
      ['components', fetchComponents],
      ['component instances', fetchComponentInstances],
      ['contexts', fetchContexts],
      ['context types', fetchContextTypes],
      ['nodes', fetchNodes],
      ['node types', fetchNodeTypes],
      ['findings', fetchFindings],
      ['finding types', fetchFindingTypes],
    ]
    for (const [name, fetchAll] of lists) {
      const items = await fetchAll()
      expect(items.length, name).toBeGreaterThan(0)
    }
  })

  it('decodes annotations from the wire entry-list form', async () => {
    const withAnnotations = systems.find((s) => s.systemId === '1b000002-0000-4a1b-8b00-000000000002')
    await expect(fetchSystemById(withAnnotations!.systemId)).resolves.toMatchObject({
      annotations: { 'emeland.io/owner': 'obs-team' },
    })
  })

  it('decodes wire-format findings (resource ids, resolved type refs)', async () => {
    const list = await fetchFindings()
    const f = list[0]
    expect(f.findingId).toBeTruthy()
    expect(f.resources[0].resourceId).toBeTruthy()
    expect(f.findingType?.findingTypeId).toBeTruthy()
  })

  it('decodes the model', async () => {
    await expect(fetchModel()).resolves.toMatchObject({ modelId: expect.any(String) })
  })

  it('throws a plain not-found error for unknown mock ids', async () => {
    await expect(fetchApiById('nope')).rejects.toThrowError(/not found in mocks/)
    await expect(fetchContextById('nope')).rejects.toThrowError(/not found in mocks/)
    await expect(fetchNodeById('nope')).rejects.toThrowError(/not found in mocks/)
    await expect(fetchComponentById('nope')).rejects.toThrowError(/not found in mocks/)
    await expect(fetchFindingById('nope')).rejects.toThrowError(/not found in mocks/)
  })
})
