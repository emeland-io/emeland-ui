import { describe, expect, it } from 'vitest'
import { blankDocument } from '@/editor/kinds'
import { emelandctlCreateCommand, emelandctlCreateScript } from '@/editor/emelandctl'

describe('emelandctl create commands', () => {
  it('builds a system create command', () => {
    const doc = blankDocument('System')
    doc.spec.displayName = 'Billing'
    doc.spec.description = 'core'
    doc.spec.abstract = true
    doc.spec.parent = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    doc.spec.annotations = { owner: 'platform' }
    const cmd = emelandctlCreateCommand(doc)
    expect(cmd).toContain('emelandctl create system')
    expect(cmd).toContain('Billing')
    expect(cmd).toContain('--desc core')
    expect(cmd).toContain('--abstract')
    expect(cmd).toContain('--parent aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
    expect(cmd).toContain('--annotation owner=platform')
  })

  it('quotes names with spaces', () => {
    const doc = blankDocument('System')
    doc.spec.displayName = 'Pay ments'
    expect(emelandctlCreateCommand(doc)).toContain("'Pay ments'")
  })

  it('returns null for kinds without create', () => {
    const doc = blankDocument('Metric')
    expect(emelandctlCreateCommand(doc)).toBeNull()
  })

  it('scripts a bundle with a comment for unsupported kinds', () => {
    const system = blankDocument('System')
    system.spec.displayName = 'A'
    const metric = blankDocument('Metric')
    metric.spec.displayName = 'M'
    const script = emelandctlCreateScript([system, metric])
    expect(script).toContain('emelandctl create system')
    expect(script).toContain('# Metric:')
  })
})
