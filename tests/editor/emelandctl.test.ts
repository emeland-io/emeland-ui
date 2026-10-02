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

  it('builds create commands for newly added emelandctl kinds', () => {
    const finding = blankDocument('Finding')
    finding.spec.displayName = 'Integrity'
    finding.spec.description = 'phase-0'
    expect(emelandctlCreateCommand(finding)).toContain('emelandctl create finding')
    expect(emelandctlCreateCommand(finding)).toContain('--desc phase-0')

    const apiInst = blankDocument('ApiInstance')
    apiInst.spec.displayName = 'Payments API'
    apiInst.spec.api = '550e8400-e29b-41d4-a716-446655440001'
    apiInst.spec.systemInstance = '550e8400-e29b-41d4-a716-446655440002'
    const apiCmd = emelandctlCreateCommand(apiInst)
    expect(apiCmd).toContain('emelandctl create api-instance')
    expect(apiCmd).toContain('--api 550e8400-e29b-41d4-a716-446655440001')
    expect(apiCmd).toContain('--system-instance 550e8400-e29b-41d4-a716-446655440002')

    const org = blankDocument('OrgUnit')
    org.spec.displayName = 'Platform'
    org.spec.parent = '550e8400-e29b-41d4-a716-446655440003'
    expect(emelandctlCreateCommand(org)).toContain('emelandctl create org-unit')
    expect(emelandctlCreateCommand(org)).toContain('--parent 550e8400-e29b-41d4-a716-446655440003')
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
