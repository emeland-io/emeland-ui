import type { FindingType, Finding } from '@/types/finding'

/**
 * FindingTypes mockups
 */
export const findingTypes: FindingType[] = [
  {
    findingTypeId: 'a1b2c3d4-e5f6-4a7b-8c9d-1e2f3a4b5c6d',
    displayName: 'Context type missing',
    description:
      'A Context references a ContextType that does not exist in the model, or has no type set at all.',
    annotations: { 'emeland.io/finding-kind': 'ContextTypeMissing', 'emeland.io/built-in': 'true' },
  },
  {
    findingTypeId: 'b2c3d4e5-f6a7-4b8c-9d1e-2f3a4b5c6d7e',
    displayName: 'Context parent not found',
    description:
      'A Context references a parent Context by UUID but that parent does not exist in the model.',
    annotations: {
      'emeland.io/finding-kind': 'ContextParentNotFound',
      'emeland.io/built-in': 'true',
    },
  },
  {
    findingTypeId: 'c3d4e5f6-a7b8-4c9d-1e2f-3a4b5c6d7e8f',
    displayName: 'Node type missing',
    description: 'A Node has no NodeType assigned.',
    annotations: { 'emeland.io/finding-kind': 'NodeTypeMissing', 'emeland.io/built-in': 'true' },
  },
  {
    findingTypeId: 'd4e5f6a7-b8c9-4d1e-2f3a-4b5c6d7e8f9a',
    displayName: 'Consumer lag exceeded',
    description: 'Consumer lag on a subscribed topic exceeds the configured threshold.',
    annotations: { 'emeland.io/finding-kind': 'ConsumerLagExceeded' },
  },
  {
    findingTypeId: 'e5f6a7b8-c9d1-4e2f-3a4b-5c6d7e8f9a1b',
    displayName: 'Version mismatch with template',
    description: 'Instance version does not match the system template version.',
    annotations: { 'emeland.io/finding-kind': 'VersionMismatch' },
  },
]

/**
 * Findings mockups
 *
 * Cross-references:
 *   From contexts.ts:
 *     CI/CD:         e2b4c6d8-f1a3-4e5b-9c7d-2a4f6e8b1d3c
 *   From systems.ts:
 *     app-prod-eu:   e8b9c1d2-3f4a-4b5c-6d7e-8f9a1b2c3d4e
 *     Application:   7a1b2c3d-4e5f-4a6b-8c9d-1e2f3a4b5c6d
 *     prom-prod:     2b3c4d5e-6f7a-4b8c-9d1e-2f3a4b5c6d7e
 *   From nodes.ts:
 *     Sensor System A: b1c2d3e4-f5a6-4b7c-8d9e-1f2a3b4c5d6e
 */
export const findings: Finding[] = [
  {
    findingId: '11a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    summary: 'Context type missing',
    description: 'Context "CI/CD" has no ContextType set.',
    type: 'a1b2c3d4-e5f6-4a7b-8c9d-1e2f3a4b5c6d', // ContextTypeMissing
    resources: [{ resourceId: 'e2b4c6d8-f1a3-4e5b-9c7d-2a4f6e8b1d3c', resourceType: 'Context' }],
    annotations: { 'eximpl.emeland.io/detected-at': '2026-05-28T07:00:00Z' },
  },
  {
    findingId: '22b3c4d5-e6f7-4a8b-9c1d-1e2f3a4b5c6d',
    summary: 'Version mismatch with system template',
    description: 'instance v1.7.9 != system v1.8.3',
    type: 'e5f6a7b8-c9d1-4e2f-3a4b-5c6d7e8f9a1b', // VersionMismatch
    resources: [
      { resourceId: 'e8b9c1d2-3f4a-4b5c-6d7e-8f9a1b2c3d4e', resourceType: 'SystemInstance' },
      { resourceId: '7a1b2c3d-4e5f-4a6b-8c9d-1e2f3a4b5c6d', resourceType: 'System' },
    ],
    annotations: {
      'emeland.io/instance-version': 'v1.7.9',
      'emeland.io/system-version': 'v1.8.3',
      'eximpl.emeland.io/detected-at': '2026-05-28T08:15:22Z',
    },
  },
  {
    findingId: '33c4d5e6-f7a8-4b9c-1d2e-2f3a4b5c6d7e',
    summary: 'Consumer lag exceeds threshold',
    description: 'max-consumer-lag <= 500 (current: 2841 on system-b.events)',
    type: 'd4e5f6a7-b8c9-4d1e-2f3a-4b5c6d7e8f9a', // ConsumerLagExceeded
    resources: [
      { resourceId: '2b3c4d5e-6f7a-4b8c-9d1e-2f3a4b5c6d7e', resourceType: 'SystemInstance' },
    ],
    annotations: {
      'emeland.io/threshold': '500',
      'emeland.io/current-value': '2841',
      'emeland.io/topic': 'system-b.events',
      'eximpl.emeland.io/detected-at': '2026-05-28T09:23:41Z',
    },
  },
  {
    findingId: '44d5e6f7-a8b9-4c1d-2e3f-3a4b5c6d7e8f',
    summary: 'Node type missing',
    description: 'Sensor node "Sensor System A" has no NodeType assigned.',
    type: 'c3d4e5f6-a7b8-4c9d-1e2f-3a4b5c6d7e8f', // NodeTypeMissing
    resources: [
      // Sensor System A in nodes.ts
      { resourceId: 'b1c2d3e4-f5a6-4b7c-8d9e-1f2a3b4c5d6e', resourceType: 'Node' },
    ],
    annotations: {
      'eximpl.emeland.io/detected-at': '2026-05-28T10:05:00Z',
    },
  },
]
