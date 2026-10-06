import { describe, expect, it } from 'vitest'
import { issueSourceRange } from '@/editor/yamlIssueRange'

function slice(text: string, path: string): string {
  const range = issueSourceRange(text, path)
  expect(range).toBeTruthy()
  return text.slice(range!.from, range!.to)
}

describe('issueSourceRange', () => {
  const artifact = `version: emeland.io/v1
kind: Artifact
spec:
  artifactId: null
  displayName: New Artifact
`

  it('marks the invalid field line, not the first line', () => {
    expect(slice(artifact, 'spec.artifactId')).toBe('artifactId: null')
    expect(slice(artifact, 'kind')).toBe('kind: Artifact')
    expect(slice(artifact, 'version')).toBe('version: emeland.io/v1')
  })

  it('falls back to the parent when a key is missing', () => {
    const text = `version: emeland.io/v1
kind: Artifact
spec:
  displayName: New Artifact
`
    expect(slice(text, 'spec.artifactId')).toBe('spec:')
  })

  it('matches annotation keys that contain dots', () => {
    const text = `version: emeland.io/v1
kind: System
spec:
  annotations:
    emeland.io/owner-groups:
`
    expect(slice(text, 'spec.annotations.emeland.io/owner-groups')).toContain(
      'emeland.io/owner-groups:',
    )
  })

  it('maps bundle document[n] paths onto the matching document', () => {
    const text = `version: emeland.io/v1
kind: Artifact
spec:
  artifactId: null
  displayName: A
---
version: emeland.io/v1
kind: Artifact
spec:
  artifactId: not-a-uuid
  displayName: B
`
    expect(slice(text, 'document[0].spec.artifactId')).toBe('artifactId: null')
    expect(slice(text, 'document[1].spec.artifactId')).toBe('artifactId: not-a-uuid')
  })
})
