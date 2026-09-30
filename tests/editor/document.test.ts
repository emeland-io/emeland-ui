import { describe, expect, it } from 'vitest'
import {
  bundleDownloadFilename,
  formSpecToYamlSpec,
  parseBundle,
  parseDocument,
  stringifyBundle,
  stringifyDocument,
  validateBundle,
  validateDocument,
  validateYamlText,
} from '@/editor/document'
import { blankDocument } from '@/editor/kinds'

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
    const id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    doc.spec.metricInstanceRef = id
    const yamlSpec = formSpecToYamlSpec('Threshold', doc.spec)
    expect(yamlSpec.metricInstanceRef).toEqual({ metricInstanceId: id })
    expect(validateDocument(doc).ok).toBe(true)
  })

  it('reports schema errors inline', () => {
    const doc = blankDocument('Context')
    delete doc.spec.type
    const result = validateDocument(doc)
    expect(result.ok).toBe(false)
    expect(result.issues.some((i) => i.path.includes('type'))).toBe(true)
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
  capabilityId: 11111111-1111-1111-1111-111111111111
  displayName: Mail Service
  versions:
    - capabilityVersionId: 22222222-2222-2222-2222-222222222222
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
})
