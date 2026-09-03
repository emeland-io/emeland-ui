import type {
  System as SystemWire,
  SystemInstance as SystemInstanceWire,
} from '@/api/gen/types.gen'

const STACK = '1b000002-0000-4a1b-8b00-000000000002'
const MISSING_PARENT = 'ffffffff-0000-4a1b-8b00-0000000000ff'
// dangling system reference for unmapped-instance demos (spec requires the field)
const MISSING_SYSTEM = 'ffffffff-0000-4a1b-8b00-0000000000ee'

export const systems = [
  {
    systemId: STACK,
    displayName: 'kube-prometheus-stack',
    description:
      'Monitoring complex deployed together from a single Helm chart. Groups Prometheus, its operator and Grafana as sub-systems.',
    version: { version: '0.75.0', availableFrom: '2026-03-01T00:00:00Z' },
    abstract: false,
    annotations: [
      {
        key: 'p1-system-template-source',
        value: 'helm:prometheus-community/kube-prometheus-stack:0.75.0',
      },
      {
        key: 'p1-system-template-artifact-id',
        value: '4c2f9a10-7b3d-4e21-9f8a-0c1d2e3f4a5b',
      },
      { key: 'emeland.io/owner-identities', value: 'obs-team' },
    ],
  },
  {
    systemId: '9c3d4e5f-6a7b-4c8d-1e2f-3a4b5c6d7e8f',
    displayName: 'Grafana',
    description: 'Observability dashboards and alerting. Consumes Prometheus metrics API.',
    version: { version: '11.1.0', availableFrom: '2026-02-20T00:00:00Z' },
    abstract: false,
    parent: STACK,
    annotations: [
      { key: 'p1-system-template-source', value: 'helm:grafana/grafana:11.1.0' },
      { key: 'emeland.io/owner-identities', value: 'obs-team' },
    ],
  },
  {
    systemId: 'a4d5e6f7-8b9c-4d1e-2f3a-4b5c6d7e8f9a',
    displayName: 'Prometheus',
    description: 'Time-series metrics collection and storage. Exposes PromQL query API.',
    version: { version: '2.53.0', availableFrom: '2026-03-01T00:00:00Z' },
    abstract: false,
    parent: STACK,
    annotations: [
      {
        key: 'p1-system-template-source',
        value: 'helm:prometheus-community/prometheus:2.53.0',
      },
      { key: 'emeland.io/owner-identities', value: 'obs-team' },
    ],
  },
  {
    systemId: 'b5e6f7a8-9c1d-4e2f-3a4b-5c6d7e8f9a1b',
    displayName: 'Prometheus Operator',
    description: 'Manages Prometheus instances, ServiceMonitors and alerting rules via CRDs.',
    version: { version: '0.75.0', availableFrom: '2026-03-01T00:00:00Z' },
    abstract: false,
    parent: STACK,
    annotations: [
      {
        key: 'p1-system-template-source',
        value: 'helm:prometheus-community/kube-prometheus-stack:0.75.0',
      },
      { key: 'emeland.io/owner-identities', value: 'obs-team' },
    ],
  },
  {
    systemId: '7a1b2c3d-4e5f-4a6b-8c9d-1e2f3a4b5c6d',
    displayName: 'Application',
    description:
      'Primary business application. Deployed from Helm chart with frontend and backend components.',
    version: { version: '1.8.3', availableFrom: '2026-04-01T00:00:00Z' },
    abstract: false,
    annotations: [
      {
        key: 'p1-system-template-source',
        value: 'helm:registry.internal/charts/application:1.8.3',
      },
      {
        key: 'p1-system-template-artifact-id',
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      },
      { key: 'emeland.io/owner-identities', value: 'platform-team' },
    ],
  },
  {
    systemId: '8b2c3d4e-5f6a-4b7c-9d1e-2f3a4b5c6d7e',
    displayName: 'Kong API Gateway',
    description: 'API gateway providing ingress routing, rate limiting and authentication.',
    version: { version: '3.6.1', availableFrom: '2026-03-15T00:00:00Z' },
    abstract: false,
    annotations: [
      { key: 'p1-system-template-source', value: 'helm:kong/kong:3.6.1' },
      { key: 'emeland.io/owner-identities', value: 'infra-team' },
    ],
  },
  {
    systemId: 'c6f7a8b9-1d2e-4f3a-4b5c-6d7e8f9a1b2c',
    displayName: 'DNS Service',
    description: 'External DNS resolution. Abstract system — only the API is known.',
    version: { version: '1.0.0' },
    abstract: true,
    annotations: [
      { key: 'p1-system-abstract', value: 'true' },
      { key: 'emeland.io/owner-identities', value: 'infra-team' },
    ],
  },
  {
    systemId: 'd7a8b9c1-2e3f-4a4b-5c6d-7e8f9a1b2c3d',
    displayName: 'Database Service',
    description: 'Managed PostgreSQL cluster. Abstract system — consumed via connection API.',
    version: { version: '16.2.0' },
    abstract: true,
    annotations: [
      { key: 'p1-system-abstract', value: 'true' },
      { key: 'emeland.io/owner-identities', value: 'infra-team' },
    ],
  },
  {
    systemId: '1b000009-0000-4a1b-8b00-000000000009',
    displayName: 'Legacy Reporting',
    description:
      'Decommissioned reporting system. Its declared parent system is no longer part of the landscape.',
    version: { version: '0.9.0', deprecatedFrom: '2026-01-01T00:00:00Z' },
    abstract: false,
    parent: MISSING_PARENT,
    annotations: [
      { key: 'emeland.io/owner-identities', value: 'data-team' },
      { key: 'p1-system-status', value: 'legacy' },
    ],
  },
] satisfies SystemWire[]
export const systemInstances = [
  {
    systemInstanceId: 'e8b9c1d2-3f4a-4b5c-6d7e-8f9a1b2c3d4e',
    displayName: 'Application (prod-eu)',
    system: '7a1b2c3d-4e5f-4a6b-8c9d-1e2f3a4b5c6d', // Application
    context: '0a000000-0000-4211-8000-000000000004', // Berlin (prod region)
    annotations: [
      { key: 'eximpl.emeland.io/last-update', value: '2026-05-28T09:24:11Z' },
      { key: 'cluster', value: 'ber-prod' },
      { key: 'namespace', value: 'app' },
    ],
  },
  {
    systemInstanceId: 'e8b9c1d2-0000-4b5c-8d7e-8f9a1b2c3d02',
    displayName: 'Application (staging)',
    system: '7a1b2c3d-4e5f-4a6b-8c9d-1e2f3a4b5c6d', // Application
    context: 'c82b137d-5e63-471a-8260-032a920be38e', // Staging
    annotations: [
      { key: 'eximpl.emeland.io/last-update', value: '2026-05-28T09:20:44Z' },
      { key: 'cluster', value: 'ber-staging' },
      { key: 'namespace', value: 'app' },
    ],
  },
  {
    systemInstanceId: 'f9c1d2e3-4a5b-4c6d-7e8f-9a1b2c3d4e5f',
    displayName: 'Kong (prod-eu)',
    system: '8b2c3d4e-5f6a-4b7c-9d1e-2f3a4b5c6d7e', // Kong
    context: '0a000000-0000-4211-8000-000000000004', // Berlin (prod region)
    annotations: [
      { key: 'eximpl.emeland.io/last-update', value: '2026-05-28T09:24:08Z' },
      { key: 'cluster', value: 'ber-prod' },
      { key: 'namespace', value: 'kong' },
    ],
  },
  {
    systemInstanceId: 'f9c1d2e3-0000-4c6d-8e8f-9a1b2c3d4e02',
    displayName: 'Kong (staging)',
    system: '8b2c3d4e-5f6a-4b7c-9d1e-2f3a4b5c6d7e', // Kong
    context: 'c82b137d-5e63-471a-8260-032a920be38e', // Staging
    annotations: [
      { key: 'eximpl.emeland.io/last-update', value: '2026-05-28T09:21:02Z' },
      { key: 'cluster', value: 'ber-staging' },
      { key: 'namespace', value: 'kong' },
    ],
  },
  {
    systemInstanceId: '1a2b3c4d-5e6f-4a7b-8c9d-1e2f3a4b5c6d',
    displayName: 'Grafana (prod)',
    system: '9c3d4e5f-6a7b-4c8d-1e2f-3a4b5c6d7e8f', // Grafana
    context: 'a157790b-33ce-4ca8-9844-32386da44b6c', // Production
    annotations: [
      { key: 'eximpl.emeland.io/last-update', value: '2026-05-28T09:23:55Z' },
      { key: 'cluster', value: 'ber-prod' },
      { key: 'namespace', value: 'monitoring' },
    ],
  },
  {
    systemInstanceId: '1a2b3c4d-0000-4a8c-8d1e-2f3a4b5c6d02',
    displayName: 'Grafana (staging)',
    system: '9c3d4e5f-6a7b-4c8d-1e2f-3a4b5c6d7e8f', // Grafana
    context: 'c82b137d-5e63-471a-8260-032a920be38e', // Staging
    annotations: [
      { key: 'eximpl.emeland.io/last-update', value: '2026-05-28T09:22:19Z' },
      { key: 'cluster', value: 'ber-staging' },
      { key: 'namespace', value: 'monitoring' },
    ],
  },
  {
    systemInstanceId: '2b3c4d5e-6f7a-4b8c-9d1e-2f3a4b5c6d7e',
    displayName: 'Prometheus (prod)',
    system: 'a4d5e6f7-8b9c-4d1e-2f3a-4b5c6d7e8f9a', // Prometheus
    context: 'a157790b-33ce-4ca8-9844-32386da44b6c', // Production
    annotations: [
      { key: 'eximpl.emeland.io/last-update', value: '2026-05-28T09:24:01Z' },
      { key: 'cluster', value: 'ber-prod' },
      { key: 'namespace', value: 'monitoring' },
    ],
  },
  {
    systemInstanceId: '3c4d5e6f-7a8b-4c9d-1e2f-3a4b5c6d7e8f',
    displayName: 'Prometheus Operator (prod)',
    system: 'b5e6f7a8-9c1d-4e2f-3a4b-5c6d7e8f9a1b', // Prometheus Operator
    context: 'a157790b-33ce-4ca8-9844-32386da44b6c', // Production
    annotations: [
      { key: 'eximpl.emeland.io/last-update', value: '2026-05-28T09:24:03Z' },
      { key: 'cluster', value: 'ber-prod' },
      { key: 'namespace', value: 'monitoring' },
    ],
  },

  // Unmapped instances — grouped below by their broken system reference:
  //   ffffffff-0000-4211-8000-0000000000bb  legacy estate (7)
  //   ffffffff-0000-4211-8000-0000000000cc  sensor-discovered workloads (6)
  //   ffffffff-0000-4211-8000-0000000000dd  orphaned infrastructure (5)
  //   (no system reference at all)          (4)
  {
    systemInstanceId: '4d5e6f7a-0000-4c9d-8e1f-0000000000a1',
    displayName: 'Tmp Host',
    system: MISSING_SYSTEM, // dangling reference (unmapped demo)
    context: '0a000000-0000-4211-8000-000000000004', // Berlin (prod region)
    annotations: [
      { key: 'eximpl.emeland.io/last-update', value: '2026-05-28T09:25:11Z' },
      { key: 'cluster', value: 'ber-prod' },
    ],
  },
  {
    systemInstanceId: '4d5e6f7a-0000-4c9d-8e1f-0000000000a2',
    displayName: 'Legacy Runtime',
    system: 'ffffffff-0000-4211-8000-0000000000bb', // unresolvable system reference
    context: '0a000000-0000-4211-8000-000000000008', // Altsystem
    annotations: [{ key: 'p1-system-status', value: 'legacy' }],
  },
  {
    systemInstanceId: '4d5e6f7a-0000-4c9d-8e1f-0000000000a3',
    displayName: 'Legacy Queue',
    system: 'ffffffff-0000-4211-8000-0000000000bb',
    context: '0a000000-0000-4211-8000-000000000008', // Altsystem
    annotations: [{ key: 'p1-system-status', value: 'legacy' }],
  },
  {
    systemInstanceId: '4d5e6f7a-0000-4c9d-8e1f-0000000000a4',
    displayName: 'Legacy Scheduler',
    system: 'ffffffff-0000-4211-8000-0000000000bb',
    context: '0a000000-0000-4211-8000-000000000008', // Altsystem
    annotations: [{ key: 'p1-system-status', value: 'legacy' }],
  },
  {
    systemInstanceId: '4d5e6f7a-0000-4c9d-8e1f-0000000000a5',
    displayName: 'Legacy Batch Runner',
    system: 'ffffffff-0000-4211-8000-0000000000bb',
    context: '0a000000-0000-4211-8000-000000000008', // Altsystem
    annotations: [{ key: 'p1-system-status', value: 'legacy' }],
  },
  {
    systemInstanceId: '4d5e6f7a-0000-4c9d-8e1f-0000000000a6',
    displayName: 'Legacy File Gateway',
    system: 'ffffffff-0000-4211-8000-0000000000bb',
    context: '0a000000-0000-4211-8000-000000000008', // Altsystem
    annotations: [{ key: 'p1-system-status', value: 'legacy' }],
  },
  {
    systemInstanceId: '4d5e6f7a-0000-4c9d-8e1f-0000000000a7',
    displayName: 'Legacy Print Service',
    system: 'ffffffff-0000-4211-8000-0000000000bb',
    annotations: [{ key: 'p1-system-status', value: 'legacy' }],
  },
  {
    systemInstanceId: '4d5e6f7a-0000-4c9d-8e1f-0000000000a8',
    displayName: 'Legacy Auth Bridge',
    system: 'ffffffff-0000-4211-8000-0000000000bb',
    context: '0a000000-0000-4211-8000-000000000008', // Altsystem
    annotations: [{ key: 'p1-system-status', value: 'legacy' }],
  },
  {
    systemInstanceId: '4d5e6f7a-0000-4c9d-8e1f-0000000000b1',
    displayName: 'Discovered Pod (iot-ingest)',
    system: 'ffffffff-0000-4211-8000-0000000000cc', // unresolvable system reference
    context: '0a000000-0000-4211-8000-000000000004', // Berlin (prod region)
    annotations: [
      { key: 'cluster', value: 'ber-prod' },
      { key: 'namespace', value: 'iot' },
    ],
  },
  {
    systemInstanceId: '4d5e6f7a-0000-4c9d-8e1f-0000000000b2',
    displayName: 'Discovered Pod (mqtt-bridge)',
    system: 'ffffffff-0000-4211-8000-0000000000cc',
    context: '0a000000-0000-4211-8000-000000000004', // Berlin (prod region)
    annotations: [
      { key: 'cluster', value: 'ber-prod' },
      { key: 'namespace', value: 'iot' },
    ],
  },
  {
    systemInstanceId: '4d5e6f7a-0000-4c9d-8e1f-0000000000b3',
    displayName: 'Discovered Pod (edge-relay)',
    system: 'ffffffff-0000-4211-8000-0000000000cc',
    context: 'a157790b-33ce-4ca8-9844-32386da44b6c', // Production
    annotations: [
      { key: 'cluster', value: 'ber-prod' },
      { key: 'namespace', value: 'edge' },
    ],
  },
  {
    systemInstanceId: '4d5e6f7a-0000-4c9d-8e1f-0000000000b4',
    displayName: 'Discovered Service (metrics-exporter)',
    system: 'ffffffff-0000-4211-8000-0000000000cc',
    context: 'a157790b-33ce-4ca8-9844-32386da44b6c', // Production
    annotations: [
      { key: 'cluster', value: 'ber-prod' },
      { key: 'namespace', value: 'monitoring' },
    ],
  },
  {
    systemInstanceId: '4d5e6f7a-0000-4c9d-8e1f-0000000000b5',
    displayName: 'Discovered Pod (firmware-ota)',
    system: 'ffffffff-0000-4211-8000-0000000000cc',
    context: 'c82b137d-5e63-471a-8260-032a920be38e', // Staging
    annotations: [
      { key: 'cluster', value: 'ber-staging' },
      { key: 'namespace', value: 'iot' },
    ],
  },
  {
    systemInstanceId: '4d5e6f7a-0000-4c9d-8e1f-0000000000b6',
    displayName: 'Discovered Cronjob (nightly-sync)',
    system: 'ffffffff-0000-4211-8000-0000000000cc',
    context: 'c82b137d-5e63-471a-8260-032a920be38e', // Staging
    annotations: [
      { key: 'cluster', value: 'ber-staging' },
      { key: 'namespace', value: 'batch' },
    ],
  },
  {
    systemInstanceId: '4d5e6f7a-0000-4c9d-8e1f-0000000000c1',
    displayName: 'Orphan VM (backup-01)',
    system: 'ffffffff-0000-4211-8000-0000000000dd', // unresolvable system reference
    context: 'a157790b-33ce-4ca8-9844-32386da44b6c', // Production
    annotations: [{ key: 'eximpl.emeland.io/last-update', value: '2026-05-28T08:11:44Z' }],
  },
  {
    systemInstanceId: '4d5e6f7a-0000-4c9d-8e1f-0000000000c2',
    displayName: 'Orphan VM (backup-02)',
    system: 'ffffffff-0000-4211-8000-0000000000dd',
    context: 'a157790b-33ce-4ca8-9844-32386da44b6c', // Production
    annotations: [{ key: 'eximpl.emeland.io/last-update', value: '2026-05-28T08:11:44Z' }],
  },
  {
    systemInstanceId: '4d5e6f7a-0000-4c9d-8e1f-0000000000c3',
    displayName: 'Rogue Database',
    system: 'ffffffff-0000-4211-8000-0000000000dd',
    context: '0a000000-0000-4211-8000-000000000004', // Berlin (prod region)
    annotations: [{ key: 'eximpl.emeland.io/last-update', value: '2026-05-28T08:12:03Z' }],
  },
  {
    systemInstanceId: '4d5e6f7a-0000-4c9d-8e1f-0000000000c4',
    displayName: 'Untracked Cache',
    system: 'ffffffff-0000-4211-8000-0000000000dd',
    annotations: [{ key: 'eximpl.emeland.io/last-update', value: '2026-05-28T08:12:19Z' }],
  },
  {
    systemInstanceId: '4d5e6f7a-0000-4c9d-8e1f-0000000000c5',
    displayName: 'Shadow API Gateway',
    system: 'ffffffff-0000-4211-8000-0000000000dd',
    context: 'a157790b-33ce-4ca8-9844-32386da44b6c', // Production
    annotations: [{ key: 'eximpl.emeland.io/last-update', value: '2026-05-28T08:12:31Z' }],
  },
  {
    systemInstanceId: '4d5e6f7a-0000-4c9d-8e1f-0000000000d1',
    displayName: 'Sensor Node 7',
    system: MISSING_SYSTEM, // dangling reference (unmapped demo)
    context: '0a000000-0000-4211-8000-000000000004', // Berlin (prod region)
    annotations: [{ key: 'cluster', value: 'ber-prod' }],
  },
  {
    systemInstanceId: '4d5e6f7a-0000-4c9d-8e1f-0000000000d2',
    displayName: 'Unknown Workload',
    system: MISSING_SYSTEM, // dangling reference (unmapped demo)
    context: 'c82b137d-5e63-471a-8260-032a920be38e', // Staging
    annotations: [{ key: 'cluster', value: 'ber-staging' }],
  },
  {
    systemInstanceId: '4d5e6f7a-0000-4c9d-8e1f-0000000000d3',
    displayName: 'Rogue Container',
    system: MISSING_SYSTEM, // dangling reference (unmapped demo)
    annotations: [],
  },
] satisfies SystemInstanceWire[]
