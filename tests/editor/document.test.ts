import { describe, expect, it, vi } from 'vitest'
import {
  bundleDownloadFilename,
  BUNDLE_STORAGE_KEY,
  formSpecToYamlSpec,
  issuesToFieldErrors,
  loadPersistedBundle,
  parseBundle,
  parseDocument,
  persistBundle,
  stringifyBundle,
  stringifyDocument,
  validateBundle,
  validateDocument,
  validateYamlText,
} from '@/editor/document'
import { blankDocument, RESOURCE_TYPE_BY_NAME } from '@/editor/kinds'

describe('YAML editor documents', () => {
  it('creates a valid blank System document', () => {
    const doc = blankDocument('System')
    expect(doc.version).toBe('emeland.io/v1')
    expect(doc.kind).toBe('System')
    expect(doc.spec.abstract).toBe(false)
    expect(typeof doc.spec.systemId).toBe('string')
    expect(validateDocument(doc).ok).toBe(true)
  })

  it('round-trips System through YAML', () => {
    const doc = blankDocument('System')
    doc.spec.displayName = 'Payments'
    doc.spec.annotations = { owner: 'team-alpha' }
    const text = stringifyDocument(doc)
    expect(text).toContain('kind: System')
    expect(text).toContain('owner: team-alpha')

    const { document: parsed, issues } = parseDocument(text)
    expect(issues).toEqual([])
    expect(parsed?.spec.displayName).toBe('Payments')
    expect(parsed?.spec.annotations).toEqual({ owner: 'team-alpha' })
    expect(validateDocument(parsed!).ok).toBe(true)
  })

  it('nests Threshold metricInstanceRef on stringify', () => {
    const doc = blankDocument('Threshold')
    const id = '550e8400-e29b-41d4-a716-446655440001'
    doc.spec.metricInstanceRef = id
    const yamlSpec = formSpecToYamlSpec('Threshold', doc.spec)
    expect(yamlSpec.metricInstanceRef).toEqual({ metricInstanceId: id })
    expect(validateDocument(doc).ok).toBe(true)
  })

  it('nests MetricInstance metricRef on stringify', () => {
    const doc = blankDocument('MetricInstance')
    const id = '550e8400-e29b-41d4-a716-446655440002'
    doc.spec.metricRef = id
    const yamlSpec = formSpecToYamlSpec('MetricInstance', doc.spec)
    expect(yamlSpec.metricRef).toEqual({ metricId: id })
    expect(validateDocument(doc).ok).toBe(true)
  })

  it('migrates legacy flat metric to metricRef', () => {
    const doc = blankDocument('MetricInstance')
    const id = '550e8400-e29b-41d4-a716-446655440003'
    doc.spec.metric = id
    delete doc.spec.metricRef
    const yamlSpec = formSpecToYamlSpec('MetricInstance', doc.spec)
    expect(yamlSpec.metricRef).toEqual({ metricId: id })
    expect(yamlSpec.metric).toBeUndefined()
  })

  it('reports schema errors inline', () => {
    const doc = blankDocument('Context')
    delete doc.spec.type
    const result = validateDocument(doc)
    expect(result.ok).toBe(false)
    expect(result.issues.some((i) => i.path.includes('type'))).toBe(true)
  })

  it('rejects invalid UUIDs on uuid fields', () => {
    const doc = blankDocument('Node')
    doc.spec.nodeType = 'not-a-uuid'
    const result = validateDocument(doc)
    expect(result.ok).toBe(false)
    expect(result.issues.some((i) => i.path.includes('nodeType'))).toBe(true)
  })

  it('maps nested Zod paths to form field keys', () => {
    const doc = blankDocument('Threshold')
    doc.spec.metricInstanceRef = 'not-a-uuid'
    const result = validateDocument(doc)
    expect(result.ok).toBe(false)
    const errors = issuesToFieldErrors(result.issues)
    expect(errors.metricInstanceRef).toBeTruthy()
  })

  it('rejects invalid YAML text', () => {
    const result = validateYamlText('version: [\nbroken')
    expect(result.ok).toBe(false)
    expect(result.issues.length).toBeGreaterThan(0)
  })

  it('rejects unknown kinds', () => {
    const result = validateYamlText(`version: emeland.io/v1
kind: NotAThing
spec:
  displayName: x
`)
    expect(result.ok).toBe(false)
    expect(result.issues.some((i) => i.path === 'kind')).toBe(true)
  })

  it('validates Capability with versions scaffold', () => {
    const text = `version: emeland.io/v1
kind: Capability
spec:
  capabilityId: 550e8400-e29b-41d4-a716-446655440010
  displayName: Mail Service
  versions:
    - capabilityVersionId: 550e8400-e29b-41d4-a716-446655440011
      version:
        version: "1.0.0"
        availableFrom: "2026-01-01T00:00:00Z"
`
    expect(validateYamlText(text).ok).toBe(true)
  })

  it('rejects annotations with a key but empty value', () => {
    const doc = blankDocument('System')
    doc.spec.annotations = { 'emeland.io/owner-groups': '' }
    const result = validateDocument(doc)
    expect(result.ok).toBe(false)
    expect(
      result.issues.some(
        (i) => i.path.includes('annotations') && /value/i.test(i.message),
      ),
    ).toBe(true)
  })

  it('rejects non-timestamp values for emeland.io/last-update', () => {
    const doc = blankDocument('System')
    doc.spec.annotations = { 'emeland.io/last-update': 'sdsds' }
    const result = validateDocument(doc)
    expect(result.ok).toBe(false)
    expect(
      result.issues.some(
        (i) =>
          i.path.includes('annotations') &&
          i.path.includes('last-update') &&
          /timestamp/i.test(i.message),
      ),
    ).toBe(true)
  })

  it('accepts ISO timestamps for emeland.io/last-update', () => {
    const doc = blankDocument('System')
    doc.spec.annotations = { 'emeland.io/last-update': '2026-05-28T09:24:11Z' }
    expect(validateDocument(doc).ok).toBe(true)
  })

  it('rejects annotations with empty value in YAML', () => {
    const doc = blankDocument('System')
    const id = doc.spec.systemId
    const text = `version: emeland.io/v1
kind: System
spec:
  systemId: ${id}
  displayName: Payments
  abstract: false
  annotations:
    emeland.io/owner-groups:
`
    const result = validateYamlText(text)
    expect(result.ok).toBe(false)
    expect(result.issues.some((i) => i.path.includes('annotations'))).toBe(true)
  })

  it('round-trips a multi-doc bundle', () => {
    const system = blankDocument('System')
    system.spec.displayName = 'Billing'
    const metric = blankDocument('Metric')
    metric.spec.displayName = 'Latency'
    const text = stringifyBundle([system, metric])
    expect(text).toContain('---')
    expect(text).toContain('kind: System')
    expect(text).toContain('kind: Metric')

    const { documents, issues } = parseBundle(text)
    expect(issues).toEqual([])
    expect(documents).toHaveLength(2)
    expect(documents[0]?.spec.displayName).toBe('Billing')
    expect(documents[1]?.spec.displayName).toBe('Latency')
    expect(validateBundle(documents).ok).toBe(true)
  })

  it('flags invalid docs inside a bundle', () => {
    const system = blankDocument('System')
    system.spec.annotations = { 'emeland.io/owner-groups': '' }
    const result = validateBundle([system])
    expect(result.ok).toBe(false)
    expect(result.issues.some((i) => i.path.includes('document[0]'))).toBe(true)
  })

  it('names bundle downloads with date and time', () => {
    const when = new Date(2026, 8, 28, 16, 48, 5) // month is 0-based
    expect(bundleDownloadFilename(when)).toBe('2026-09-28_16-48-05-bundle.yaml')
  })

  it('persists and reloads bundle items', () => {
    const map = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => {
        map.set(k, v)
      },
      removeItem: (k: string) => {
        map.delete(k)
      },
      clear: () => map.clear(),
      key: () => null,
      length: 0,
    } as Storage)
    try {
      localStorage.removeItem(BUNDLE_STORAGE_KEY)
      const doc = blankDocument('ContextType')
      doc.spec.displayName = 'Env'
      persistBundle([{ id: 'a', document: doc }])
      const loaded = loadPersistedBundle()
      expect(loaded).toHaveLength(1)
      expect(loaded[0]?.document.spec.displayName).toBe('Env')
      persistBundle([])
      expect(loadPersistedBundle()).toEqual([])
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('covers every emelandctl create kind in the form catalog', () => {
    const emelandctlKinds = [
      'System',
      'API',
      'Component',
      'Context',
      'ContextType',
      'Node',
      'NodeType',
      'Finding',
      'FindingType',
      'SystemInstance',
      'ComponentInstance',
      'ApiInstance',
      'Product',
      'Artifact',
      'ArtifactInstance',
      'OrgUnit',
      'Group',
      'Identity',
      'PermissionSpec',
      'RoleSpec',
      'Permission',
      'Role',
      'Binding',
      'FilterRule',
      'MergeRule',
      'Capability',
      'Parameter',
    ]
    for (const kind of emelandctlKinds) {
      expect(RESOURCE_TYPE_BY_NAME[kind], kind).toBeTruthy()
      const doc = blankDocument(kind)
      expect(doc.kind).toBe(kind)
    }
  })
})
