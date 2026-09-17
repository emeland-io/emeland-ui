import type { CapabilityWireWithDescription } from '@/api/capabilities'

/**
 * Capabilities mockups (wire format, decoded via the generated zCapability
 * schema like live responses).
 *
 * A Phase 3 self-service catalog of common platform tech, aligned with the
 * systems mocks (Database Service, Kong API Gateway, kube-prometheus-stack).
 * Covers every lifecycle the UI renders: available, upcoming (Observability
 * 3.0.0), deprecated (Legacy VM hosting), terminated (mail 1.0.0) and one
 * capability without versions yet (Dedicated firewall rule).
 *
 * The Kubernetes sub-catalog (000c-0010) layers offerings: the dedicated
 * cluster consumes network/storage primitives, and the stack-shaped offerings
 * (kube-prometheus-stack, Argo CD, CI runners) install into the shared-cluster
 * namespace (0002), pulling the registry and storage budget along.
 */
export const capabilities = [
  {
    capabilityId: 'c1a2b3c4-0001-4a3b-8c1d-000000000001',
    displayName: 'Managed mail server',
    description: 'Hosted mailboxes with SMTP and IMAP access',
    versions: [
      {
        capabilityVersionId: 'c1a2b3c4-0001-4a3b-8c1d-00000000v101',
        version: { version: '1.2.0', availableFrom: '2026-01-15T00:00:00Z' },
        variants: [
          {
            inputParameters: [
              { parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p101', values: ['10 users'] },
              { parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p102', values: ['Germany'] },
            ],
            dependencies: [
              { capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000009' }, // DNS entry
              {
                capability: 'c1a2b3c4-0001-4a3b-8c1d-00000000000a', // Storage budget
                outputParameters: [
                  { parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p105', values: ['50 GB'] },
                ],
              },
            ],
          },
          {
            inputParameters: [
              { parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p101', values: ['1000 users'] },
            ],
            dependencies: [
              { capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000009' },
              {
                capability: 'c1a2b3c4-0001-4a3b-8c1d-00000000000a',
                outputParameters: [
                  { parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p105', values: ['250 GB'] },
                ],
              },
              {
                capability: 'c1a2b3c4-0001-4a3b-8c1d-00000000000b', // Load balancer
                outputParameters: [
                  { parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p107', values: ['multi-zone'] },
                ],
              },
            ],
          },
        ],
      },
      {
        capabilityVersionId: 'c1a2b3c4-0001-4a3b-8c1d-00000000v100',
        version: {
          version: '1.1.0',
          availableFrom: '2025-06-01T00:00:00Z',
          deprecatedFrom: '2026-03-01T00:00:00Z',
        },
      },
      {
        capabilityVersionId: 'c1a2b3c4-0001-4a3b-8c1d-00000000v099',
        version: {
          version: '1.0.0',
          availableFrom: '2024-09-01T00:00:00Z',
          deprecatedFrom: '2025-06-01T00:00:00Z',
          terminatedFrom: '2026-01-01T00:00:00Z',
        },
      },
    ],
    annotations: [{ key: 'emeland.io/owner-groups', value: 'platform-team' }],
  },
  {
    capabilityId: 'c1a2b3c4-0001-4a3b-8c1d-000000000002',
    displayName: 'Managed Kubernetes namespace',
    description: 'A namespace on the shared platform cluster',
    versions: [
      {
        capabilityVersionId: 'c1a2b3c4-0001-4a3b-8c1d-00000000v200',
        version: { version: '2.0.0', availableFrom: '2026-04-01T00:00:00Z' },
        variants: [
          {
            inputParameters: [
              // one variant can offer several values of a parameter
              { parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p103', values: ['small', 'medium'] },
            ],
          },
        ],
      },
    ],
    annotations: [],
  },
  {
    capabilityId: 'c1a2b3c4-0001-4a3b-8c1d-000000000003',
    displayName: 'Dedicated firewall rule',
    description: 'One rule on the perimeter firewall',
    annotations: [{ key: 'emeland.io/owner-identities', value: 'netsec-lead' }],
  },
  {
    capabilityId: 'c1a2b3c4-0001-4a3b-8c1d-000000000004',
    displayName: 'Managed PostgreSQL database',
    description: 'PostgreSQL instance with backups and patching',
    versions: [
      {
        capabilityVersionId: 'c1a2b3c4-0001-4a3b-8c1d-00000000v401',
        version: { version: '2.0.0', availableFrom: '2026-03-01T00:00:00Z' },
      },
      {
        capabilityVersionId: 'c1a2b3c4-0001-4a3b-8c1d-00000000v400',
        version: {
          version: '1.4.0',
          availableFrom: '2025-08-01T00:00:00Z',
          deprecatedFrom: '2026-05-01T00:00:00Z',
        },
      },
    ],
    annotations: [{ key: 'emeland.io/owner-identities', value: 'infra-team' }],
  },
  {
    capabilityId: 'c1a2b3c4-0001-4a3b-8c1d-000000000005',
    displayName: 'Object storage bucket (S3-compatible)',
    description: 'S3-compatible bucket on the storage grid',
    versions: [
      {
        capabilityVersionId: 'c1a2b3c4-0001-4a3b-8c1d-00000000v500',
        version: { version: '1.0.0', availableFrom: '2025-11-01T00:00:00Z' },
      },
    ],
    annotations: [{ key: 'emeland.io/owner-identities', value: 'infra-team' }],
  },
  {
    capabilityId: 'c1a2b3c4-0001-4a3b-8c1d-000000000006',
    displayName: 'Observability workspace',
    description: 'Metrics, logs and tracing stack per team',
    versions: [
      {
        // upcoming major — dashboards move to the new Grafana stack
        capabilityVersionId: 'c1a2b3c4-0001-4a3b-8c1d-00000000v601',
        version: { version: '3.0.0', availableFrom: '2026-12-01T00:00:00Z' },
      },
      {
        capabilityVersionId: 'c1a2b3c4-0001-4a3b-8c1d-00000000v600',
        version: { version: '2.1.0', availableFrom: '2026-02-01T00:00:00Z' },
      },
    ],
    annotations: [{ key: 'emeland.io/owner-identities', value: 'obs-team' }],
  },
  {
    capabilityId: 'c1a2b3c4-0001-4a3b-8c1d-000000000007',
    displayName: 'Managed API gateway route',
    description: 'Routed and rate-limited endpoint on the gateway',
    versions: [
      {
        capabilityVersionId: 'c1a2b3c4-0001-4a3b-8c1d-00000000v700',
        version: { version: '1.3.0', availableFrom: '2026-03-15T00:00:00Z' },
        variants: [
          {
            // dangling reference: demos the unresolved-dependency state
            dependencies: [{ capability: 'ffffffff-0000-4a3b-8c1d-0000000000ff' }],
          },
        ],
      },
    ],
    annotations: [{ key: 'emeland.io/owner-identities', value: 'infra-team' }],
  },
  {
    capabilityId: 'c1a2b3c4-0001-4a3b-8c1d-000000000008',
    displayName: 'Legacy VM hosting',
    description: 'Single VM on the legacy hypervisor estate',
    versions: [
      {
        capabilityVersionId: 'c1a2b3c4-0001-4a3b-8c1d-00000000v800',
        version: {
          version: '0.9.0',
          availableFrom: '2023-01-01T00:00:00Z',
          deprecatedFrom: '2026-06-01T00:00:00Z',
        },
      },
    ],
    annotations: [
      { key: 'emeland.io/owner-identities', value: 'ops-lead' },
      { key: 'p3-successor', value: 'Managed Kubernetes namespace' },
    ],
  },
  {
    capabilityId: 'c1a2b3c4-0001-4a3b-8c1d-000000000009',
    displayName: 'DNS entry',
    description: 'One record in the corporate DNS zones',
    annotations: [],
  },
  {
    capabilityId: 'c1a2b3c4-0001-4a3b-8c1d-00000000000a',
    displayName: 'Storage budget',
    description: 'Quota slice of the shared storage pool',
    annotations: [],
  },
  {
    capabilityId: 'c1a2b3c4-0001-4a3b-8c1d-00000000000b',
    displayName: 'Load balancer',
    description: 'Anycast VIP with TLS termination',
    annotations: [],
  },

  // --- Kubernetes sub-catalog -------------------------------------------
  // A dedicated cluster offering plus stack-shaped offerings installed on
  // top of it (or of the shared-cluster namespace, 0002). The variants show
  // how the dependency graph differs with parameter values: the multi-zone
  // cluster needs more of everything than the single-zone starter.
  {
    capabilityId: 'c1a2b3c4-0001-4a3b-8c1d-00000000000c',
    displayName: 'Managed Kubernetes cluster (dedicated)',
    description: 'Dedicated cluster with managed control plane and node pools',
    versions: [
      {
        capabilityVersionId: 'c1a2b3c4-0001-4a3b-8c1d-00000000v901',
        version: { version: '4.2.0', availableFrom: '2026-05-01T00:00:00Z' },
        variants: [
          {
            // single-zone starter cluster
            inputParameters: [
              { parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p110', values: ['1.32', '1.33'] },
              { parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p111', values: ['3 nodes', '6 nodes'] },
              {
                parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p112',
                values: ['general (4 vCPU, 16 GB RAM)'],
              },
              { parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p107', values: ['single-zone'] },
            ],
            dependencies: [
              { capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000009' }, // DNS entry
              {
                capability: 'c1a2b3c4-0001-4a3b-8c1d-00000000000b', // Load balancer
                outputParameters: [
                  { parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p107', values: ['single-zone'] },
                ],
              },
              {
                capability: 'c1a2b3c4-0001-4a3b-8c1d-00000000000a', // Storage budget
                outputParameters: [
                  { parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p105', values: ['250 GB'] },
                ],
              },
            ],
          },
          {
            // multi-zone cluster for heavy or GPU workloads
            inputParameters: [
              { parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p110', values: ['1.33'] },
              { parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p111', values: ['12 nodes'] },
              {
                parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p112',
                values: ['compute (16 vCPU, 64 GB RAM)', 'gpu (8 vCPU, 64 GB RAM, 1x L40S)'],
              },
              { parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p107', values: ['multi-zone'] },
            ],
            dependencies: [
              { capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000009' }, // DNS entry
              {
                capability: 'c1a2b3c4-0001-4a3b-8c1d-00000000000b', // Load balancer
                outputParameters: [
                  { parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p107', values: ['multi-zone'] },
                ],
              },
              {
                capability: 'c1a2b3c4-0001-4a3b-8c1d-00000000000a', // Storage budget
                outputParameters: [
                  { parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p105', values: ['1 TB'] },
                ],
              },
              { capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000003' }, // Dedicated firewall rule
            ],
          },
        ],
      },
      {
        capabilityVersionId: 'c1a2b3c4-0001-4a3b-8c1d-00000000v900',
        version: {
          version: '4.1.0',
          availableFrom: '2025-10-01T00:00:00Z',
          deprecatedFrom: '2026-07-01T00:00:00Z',
        },
      },
    ],
    annotations: [{ key: 'emeland.io/owner-groups', value: 'platform-team' }],
  },
  {
    capabilityId: 'c1a2b3c4-0001-4a3b-8c1d-00000000000d',
    displayName: 'kube-prometheus-stack',
    description: 'Prometheus, Grafana and Alertmanager installed as one stack',
    versions: [
      {
        // version matches the system template in the systems mocks
        capabilityVersionId: 'c1a2b3c4-0001-4a3b-8c1d-00000000va01',
        version: { version: '0.75.0', availableFrom: '2026-03-01T00:00:00Z' },
        variants: [
          {
            inputParameters: [
              { parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p108', values: ['7 days', '30 days'] },
              { parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p109', values: ['standard'] },
            ],
            dependencies: [
              {
                capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000002', // Managed Kubernetes namespace
                outputParameters: [
                  { parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p103', values: ['small'] },
                ],
              },
              {
                capability: 'c1a2b3c4-0001-4a3b-8c1d-00000000000a', // Storage budget
                outputParameters: [
                  { parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p105', values: ['50 GB'] },
                ],
              },
            ],
          },
        ],
      },
    ],
    annotations: [
      { key: 'emeland.io/owner-identities', value: 'obs-team' },
      {
        key: 'p3-template-source',
        value: 'helm:prometheus-community/kube-prometheus-stack:0.75.0',
      },
    ],
  },
  {
    capabilityId: 'c1a2b3c4-0001-4a3b-8c1d-00000000000e',
    displayName: 'GitOps delivery (Argo CD)',
    description: 'Argo CD project syncing a Git repository into a namespace',
    versions: [
      {
        capabilityVersionId: 'c1a2b3c4-0001-4a3b-8c1d-00000000vb01',
        version: { version: '2.11.0', availableFrom: '2026-04-15T00:00:00Z' },
        variants: [
          {
            dependencies: [
              { capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000002' }, // Managed Kubernetes namespace
            ],
          },
        ],
      },
    ],
    annotations: [{ key: 'emeland.io/owner-groups', value: 'platform-team' }],
  },
  {
    capabilityId: 'c1a2b3c4-0001-4a3b-8c1d-00000000000f',
    displayName: 'Container registry project (Harbor)',
    description: 'Team project on the Harbor registry with image scanning',
    versions: [
      {
        capabilityVersionId: 'c1a2b3c4-0001-4a3b-8c1d-00000000vc01',
        version: { version: '1.2.0', availableFrom: '2025-12-01T00:00:00Z' },
        variants: [
          {
            inputParameters: [
              { parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p105', values: ['50 GB', '250 GB'] },
            ],
            dependencies: [
              {
                capability: 'c1a2b3c4-0001-4a3b-8c1d-00000000000a', // Storage budget
                outputParameters: [
                  { parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p105', values: ['250 GB'] },
                ],
              },
            ],
          },
        ],
      },
    ],
    annotations: [{ key: 'emeland.io/owner-identities', value: 'infra-team' }],
  },
  {
    capabilityId: 'c1a2b3c4-0001-4a3b-8c1d-000000000010',
    displayName: 'CI runner pool (Kubernetes)',
    description: 'Autoscaling pipeline runners on the shared cluster',
    versions: [
      {
        capabilityVersionId: 'c1a2b3c4-0001-4a3b-8c1d-00000000vd01',
        version: { version: '3.0.0', availableFrom: '2026-06-01T00:00:00Z' },
        variants: [
          {
            inputParameters: [
              { parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p113', values: ['5 jobs', '20 jobs'] },
              {
                parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p112',
                values: ['general (4 vCPU, 16 GB RAM)', 'compute (16 vCPU, 64 GB RAM)'],
              },
            ],
            dependencies: [
              { capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000002' }, // Managed Kubernetes namespace
              { capability: 'c1a2b3c4-0001-4a3b-8c1d-00000000000f' }, // Container registry project
            ],
          },
        ],
      },
    ],
    annotations: [{ key: 'emeland.io/owner-groups', value: 'platform-team' }],
  },
] satisfies CapabilityWireWithDescription[]
