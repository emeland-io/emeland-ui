import type { CapabilityVersionWire } from '@/api/capabilityVersions'

/**
 * CapabilityVersion mockups (flat landscape resources). Joined onto capabilities
 * by capability id — mirrors GET /landscape/capabilityVersions/{id}
 * Variants/dependencies live in variants.ts / dependencies.ts
 */
export const capabilityVersions = [
  {
    capabilityVersionId: 'c1a2b3c4-0001-4a3b-8c1d-00000000v101',
    displayName: '1.2.0',
    capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000001',
    version: {
      version: '1.2.0',
      availableFrom: '2026-01-15T00:00:00Z',
    },
  },
  {
    capabilityVersionId: 'c1a2b3c4-0001-4a3b-8c1d-00000000v100',
    displayName: '1.1.0',
    capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000001',
    version: {
      version: '1.1.0',
      availableFrom: '2025-06-01T00:00:00Z',
      deprecatedFrom: '2026-03-01T00:00:00Z',
    },
  },
  {
    capabilityVersionId: 'c1a2b3c4-0001-4a3b-8c1d-00000000v099',
    displayName: '1.0.0',
    capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000001',
    version: {
      version: '1.0.0',
      availableFrom: '2024-09-01T00:00:00Z',
      deprecatedFrom: '2025-06-01T00:00:00Z',
      terminatedFrom: '2026-01-01T00:00:00Z',
    },
  },
  {
    capabilityVersionId: 'c1a2b3c4-0001-4a3b-8c1d-00000000v200',
    displayName: '2.0.0',
    capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000002',
    version: {
      version: '2.0.0',
      availableFrom: '2026-04-01T00:00:00Z',
    },
  },
  {
    capabilityVersionId: 'c1a2b3c4-0001-4a3b-8c1d-00000000v401',
    displayName: '2.0.0',
    capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000004',
    version: {
      version: '2.0.0',
      availableFrom: '2026-03-01T00:00:00Z',
    },
  },
  {
    capabilityVersionId: 'c1a2b3c4-0001-4a3b-8c1d-00000000v400',
    displayName: '1.4.0',
    capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000004',
    version: {
      version: '1.4.0',
      availableFrom: '2025-08-01T00:00:00Z',
      deprecatedFrom: '2026-05-01T00:00:00Z',
    },
  },
  {
    capabilityVersionId: 'c1a2b3c4-0001-4a3b-8c1d-00000000v500',
    displayName: '1.0.0',
    capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000005',
    version: {
      version: '1.0.0',
      availableFrom: '2025-11-01T00:00:00Z',
    },
  },
  {
    capabilityVersionId: 'c1a2b3c4-0001-4a3b-8c1d-00000000v601',
    displayName: '3.0.0',
    capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000006',
    version: {
      version: '3.0.0',
      availableFrom: '2026-12-01T00:00:00Z',
    },
  },
  {
    capabilityVersionId: 'c1a2b3c4-0001-4a3b-8c1d-00000000v600',
    displayName: '2.1.0',
    capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000006',
    version: {
      version: '2.1.0',
      availableFrom: '2026-02-01T00:00:00Z',
    },
  },
  {
    capabilityVersionId: 'c1a2b3c4-0001-4a3b-8c1d-00000000v700',
    displayName: '1.3.0',
    capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000007',
    version: {
      version: '1.3.0',
      availableFrom: '2026-03-15T00:00:00Z',
    },
  },
  {
    capabilityVersionId: 'c1a2b3c4-0001-4a3b-8c1d-00000000v800',
    displayName: '0.9.0',
    capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000008',
    version: {
      version: '0.9.0',
      availableFrom: '2023-01-01T00:00:00Z',
      deprecatedFrom: '2026-06-01T00:00:00Z',
    },
  },
  {
    capabilityVersionId: 'c1a2b3c4-0001-4a3b-8c1d-00000000v901',
    displayName: '4.2.0',
    capability: 'c1a2b3c4-0001-4a3b-8c1d-00000000000c',
    version: {
      version: '4.2.0',
      availableFrom: '2026-05-01T00:00:00Z',
    },
  },
  {
    capabilityVersionId: 'c1a2b3c4-0001-4a3b-8c1d-00000000v900',
    displayName: '4.1.0',
    capability: 'c1a2b3c4-0001-4a3b-8c1d-00000000000c',
    version: {
      version: '4.1.0',
      availableFrom: '2025-10-01T00:00:00Z',
      deprecatedFrom: '2026-07-01T00:00:00Z',
    },
  },
  {
    capabilityVersionId: 'c1a2b3c4-0001-4a3b-8c1d-00000000va01',
    displayName: '0.75.0',
    capability: 'c1a2b3c4-0001-4a3b-8c1d-00000000000d',
    version: {
      version: '0.75.0',
      availableFrom: '2026-03-01T00:00:00Z',
    },
  },
  {
    capabilityVersionId: 'c1a2b3c4-0001-4a3b-8c1d-00000000vb01',
    displayName: '2.11.0',
    capability: 'c1a2b3c4-0001-4a3b-8c1d-00000000000e',
    version: {
      version: '2.11.0',
      availableFrom: '2026-04-15T00:00:00Z',
    },
  },
  {
    capabilityVersionId: 'c1a2b3c4-0001-4a3b-8c1d-00000000vc01',
    displayName: '1.2.0',
    capability: 'c1a2b3c4-0001-4a3b-8c1d-00000000000f',
    version: {
      version: '1.2.0',
      availableFrom: '2025-12-01T00:00:00Z',
    },
  },
  {
    capabilityVersionId: 'c1a2b3c4-0001-4a3b-8c1d-00000000vd01',
    displayName: '3.0.0',
    capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000010',
    version: {
      version: '3.0.0',
      availableFrom: '2026-06-01T00:00:00Z',
    },
  },
] satisfies CapabilityVersionWire[]
