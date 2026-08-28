import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { z } from 'zod'
import { ApiValidationError, parseApiResponse } from '@/api/validate'

vi.mock('@/api/fetch', () => ({
  USE_MOCKS: false,
  getJson: vi.fn(),
}))

import { getJson } from '@/api/fetch'
import {
  fetchSystems,
  fetchSystemById,
  fetchSystemInstances,
  fetchSystemInstanceById,
} from '@/api/systems'
import { fetchApis, fetchApiById, fetchApiInstances, fetchApiInstanceById } from '@/api/apis'
import {
  fetchComponents,
  fetchComponentById,
  fetchComponentInstances,
  fetchComponentInstanceById,
} from '@/api/components'
import {
  fetchContexts,
  fetchContextById,
  fetchContextTypes,
  fetchContextTypeById,
} from '@/api/contexts'
import { fetchNodes, fetchNodeById, fetchNodeTypes, fetchNodeTypeById } from '@/api/nodes'
import {
  fetchFindings,
  fetchFindingById,
  fetchFindingTypes,
  fetchFindingTypeById,
} from '@/api/findings'
import { fetchModel } from '@/api/model'
import { systems, systemInstances } from '@/mocks/systems'
import { apis, apiInstances } from '@/mocks/api'
import { components, componentInstances } from '@/mocks/components'
import { contexts, contextTypes } from '@/mocks/contexts'
import { nodes, nodeTypes } from '@/mocks/nodes'
import { findings, findingTypes } from '@/mocks/findings'
import { model } from '@/mocks/model'

const getJsonMock = vi.mocked(getJson)

beforeEach(() => {
  getJsonMock.mockReset()
  // quiet the dev-mode prettified error dump, tests assert the typed error
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('parseApiResponse', () => {
  const schema = z.object({ id: z.string() })

  it('returns the parsed value for a valid payload', () => {
    expect(parseApiResponse(schema, { id: 'a' }, 'thing')).toEqual({ id: 'a' })
  })

  it('throws ApiValidationError naming the offending path', () => {
    expect(() => parseApiResponse(schema, { id: 42 }, 'thing')).toThrowError(ApiValidationError)
    expect(() => parseApiResponse(schema, { id: 42 }, 'thing')).toThrowError(/thing/)
    expect(() => parseApiResponse(schema, { id: 42 }, 'thing')).toThrowError(/id/)
  })

  it('caps the message at a few issues and counts the rest', () => {
    const list = z.array(schema)
    const bad = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }]
    try {
      parseApiResponse(list, bad, 'things')
      expect.unreachable()
    } catch (e) {
      expect(e).toBeInstanceOf(ApiValidationError)
      expect((e as Error).message).toMatch(/\(\+\d+ more\)/)
      expect((e as ApiValidationError).issues.length).toBeGreaterThan(3)
    }
  })
})

describe('resource api validation', () => {
  it('decodes a valid detail response', async () => {
    getJsonMock.mockResolvedValue({ systemId: 's1', displayName: 'Billing', abstract: false })
    await expect(fetchSystemById('s1')).resolves.toMatchObject({
      systemId: 's1',
      displayName: 'Billing',
      annotations: {},
    })
  })

  it('throws ApiValidationError for a malformed detail response', async () => {
    getJsonMock.mockResolvedValue({ systemId: 's1', displayName: 42, abstract: false, annotations: 'nope' })
    await expect(fetchSystemById('s1')).rejects.toBeInstanceOf(ApiValidationError)
    getJsonMock.mockResolvedValue({ systemId: 's1', displayName: 42, abstract: false, annotations: 'nope' })
    await expect(fetchSystemById('s1')).rejects.toThrowError(/System s1/)
  })

  it('throws ApiValidationError when a list response is not an array', async () => {
    getJsonMock.mockResolvedValue({ items: [] })
    await expect(fetchSystems()).rejects.toBeInstanceOf(ApiValidationError)
  })

  it('throws ApiValidationError for a malformed item inside a list response', async () => {
    getJsonMock.mockResolvedValue([
      { findingId: 'f1', displayName: 'ok', resources: [] },
      { displayName: 'missing id' },
    ])
    await expect(fetchFindings()).rejects.toThrowError(/1\.findingId/)
  })
})

describe('id enforcement', () => {
  it('rejects a detail payload without any id', async () => {
    // otherwise schema-valid, but no id anywhere
    getJsonMock.mockResolvedValue({ displayName: 'no id at all', type: 'OpenAPI' })
    await expect(fetchApiById('a1')).rejects.toThrowError(/apiId/)
    getJsonMock.mockResolvedValue({ displayName: 'no id at all', type: 'Environment' })
    await expect(fetchContextById('c1')).rejects.toThrowError(/contextId/)
  })

  it('rejects empty-string ids', async () => {
    getJsonMock.mockResolvedValue({ systemId: '', displayName: 'empty id', abstract: false })
    await expect(fetchSystemById('s1')).rejects.toBeInstanceOf(ApiValidationError)
    getJsonMock.mockResolvedValue([{ instanceId: '', displayName: 'empty id' }])
    await expect(fetchSystems()).rejects.toBeInstanceOf(ApiValidationError)
  })

  it('accepts the instanceId fallback for detail responses', async () => {
    getJsonMock.mockResolvedValue({ instanceId: 'i-9', displayName: 'via fallback', abstract: false })
    await expect(fetchSystemById('s1')).resolves.toMatchObject({ systemId: 'i-9' })
  })

  it('accepts the instanceId fallback even when the schema requires the id', async () => {
    // zSystemInstance.systemInstanceId is required in the spec, the fallback
    // is injected before parsing so spec optionality does not decide
    getJsonMock.mockResolvedValue({ instanceId: 'i-9', displayName: 'via fallback', system: 's1' })
    await expect(fetchSystemInstanceById('si1')).resolves.toMatchObject({
      systemInstanceId: 'i-9',
    })
  })
})

describe('every module validates', () => {
  const detailCases: [string, (id: string) => Promise<unknown>][] = [
    ['System', fetchSystemById],
    ['System instance', fetchSystemInstanceById],
    ['API', fetchApiById],
    ['API instance', fetchApiInstanceById],
    ['Component', fetchComponentById],
    ['Component instance', fetchComponentInstanceById],
    ['Context', fetchContextById],
    ['Context type', fetchContextTypeById],
    ['Node', fetchNodeById],
    ['Node type', fetchNodeTypeById],
    ['Finding', fetchFindingById],
    ['Finding type', fetchFindingTypeById],
  ]

  it.each(detailCases)('%s: wrong-typed displayName throws', async (_name, fetchById) => {
    getJsonMock.mockResolvedValue({ instanceId: 'i1', displayName: 42 })
    await expect(fetchById('x')).rejects.toBeInstanceOf(ApiValidationError)
  })

  it.each(detailCases)('%s: id-less payload throws', async (_name, fetchById) => {
    getJsonMock.mockResolvedValue({ displayName: 'no id' })
    await expect(fetchById('x')).rejects.toBeInstanceOf(ApiValidationError)
  })

  it('model: id-less payload throws', async () => {
    getJsonMock.mockResolvedValue({ displayName: 'no id' })
    await expect(fetchModel()).rejects.toBeInstanceOf(ApiValidationError)
  })

  const listCases: [string, () => Promise<unknown>][] = [
    ['systems', fetchSystems],
    ['system instances', fetchSystemInstances],
    ['APIs', fetchApis],
    ['API instances', fetchApiInstances],
    ['components', fetchComponents],
    ['component instances', fetchComponentInstances],
    ['contexts', fetchContexts],
    ['context types', fetchContextTypes],
    ['nodes', fetchNodes],
    ['node types', fetchNodeTypes],
    ['findings', fetchFindings],
    ['finding types', fetchFindingTypes],
  ]

  it.each(listCases)('%s: item without a valid id throws', async (_name, fetchAll) => {
    getJsonMock.mockResolvedValue([{ displayName: 'no id' }])
    await expect(fetchAll()).rejects.toBeInstanceOf(ApiValidationError)
  })
})

describe('bundled mocks satisfy the wire schemas', () => {
  it('resource details decode cleanly', async () => {
    const detailCases: [unknown, (id: string) => Promise<unknown>, string][] = [
      [systems[0], fetchSystemById, systems[0].systemId],
      [systemInstances[0], fetchSystemInstanceById, systemInstances[0].systemInstanceId],
      [apis[0], fetchApiById, apis[0].apiId],
      [apiInstances[0], fetchApiInstanceById, apiInstances[0].apiInstanceId],
      [components[0], fetchComponentById, components[0].componentId],
      [componentInstances[0], fetchComponentInstanceById, componentInstances[0].componentInstanceId],
      [contexts[0], fetchContextById, contexts[0].contextId],
      [contextTypes[0], fetchContextTypeById, contextTypes[0].contextTypeId],
      [nodes[0], fetchNodeById, nodes[0].nodeId],
      [nodeTypes[0], fetchNodeTypeById, nodeTypes[0].nodeTypeId],
      [findingTypes[0], fetchFindingTypeById, findingTypes[0].findingTypeId],
    ]
    for (const [payload, fetchById, id] of detailCases) {
      getJsonMock.mockResolvedValue(payload)
      await expect(fetchById(id)).resolves.toBeDefined()
    }
  })

  it('findings decode cleanly (mocks are wire-format fixtures)', async () => {
    getJsonMock.mockResolvedValue(findings[0])
    await expect(fetchFindingById(findings[0].findingId)).resolves.toMatchObject({
      findingId: findings[0].findingId,
    })
  })

  it('the model decodes cleanly', async () => {
    getJsonMock.mockResolvedValue(model)
    await expect(fetchModel()).resolves.toMatchObject({ modelId: model.modelId })
  })
})

describe('contract drift telemetry (dev only)', () => {
  it('warns on unknown keys without rejecting the response', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    getJsonMock.mockResolvedValue({ systemId: 's1', displayName: 'Billing', abstract: false, futureField: 1 })
    await expect(fetchSystemById('s1')).resolves.toMatchObject({ systemId: 's1' })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('futureField'))
  })

  it('warns on unknown keys in the first list item', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    getJsonMock.mockResolvedValue([{ instanceId: 'i1', displayName: 'A', renamedField: 1 }])
    await expect(fetchSystems()).resolves.toHaveLength(1)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('renamedField'))
  })

  it('does not warn on the sanctioned instanceId fallback key', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    getJsonMock.mockResolvedValue({ instanceId: 'i-9', displayName: 'A', abstract: false })
    await expect(fetchSystemById('s1')).resolves.toBeDefined()
    expect(warn).not.toHaveBeenCalled()
  })
})

describe('version timestamps', () => {
  it('accepts numeric-offset ISO timestamps (format shim: shape, not formats)', async () => {
    getJsonMock.mockResolvedValue({
      systemId: 's1',
      displayName: 'Billing',
      abstract: false,
      version: { version: '1.0.0', availableFrom: '2026-03-01T00:00:00+02:00' },
    })
    await expect(fetchSystemById('s1')).resolves.toMatchObject({
      version: { version: '1.0.0', availableFrom: '2026-03-01T00:00:00+02:00' },
    })
  })
})

describe('ApiHttpError', () => {
  it('keeps the server detail as a field, not only in the message', async () => {
    // importActual: '@/api/fetch' is mocked module-wide in this file
    const { ApiHttpError } = (await vi.importActual('@/api/fetch')) as {
      ApiHttpError: new (what: string, status: number, detail?: string) => Error & {
        detail?: string
      }
    }
    const err = new ApiHttpError('systems', 503, 'upstream unavailable')
    expect(err.detail).toBe('upstream unavailable')
    expect(err.message).toContain('upstream unavailable')
  })
})

describe('model annotations', () => {
  it('decodes entry-list annotations (the backend wire format)', async () => {
    getJsonMock.mockResolvedValue({
      ...model,
      annotations: [{ key: 'team', value: 'platform' }],
    })
    await expect(fetchModel()).resolves.toMatchObject({ annotations: { team: 'platform' } })
  })
})
