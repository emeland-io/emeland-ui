import type { System, SystemInstance } from '@/types/system'

/**
 * Systems mockups
 *
 * IDs referenced by:
 *   - SystemInstances below (system field)
 *   - Components in components.ts (system field)
 *   - APIs in apis.ts (system field)
 */
export const systems: System[] = [
  {
    systemId: '7a1b2c3d-4e5f-4a6b-8c9d-1e2f3a4b5c6d',
    displayName: 'Application',
    description:
      'Primary business application. Deployed from Helm chart with frontend and backend components.',
    version: { version: '1.8.3', availableFrom: '2026-04-01T00:00:00Z' },
    abstract: false,
    annotations: {
      'emeland.io/p1-system-template-source': 'helm:registry.internal/charts/application:1.8.3',
      'emeland.io/owner': 'platform-team',
    },
  },
  {
    systemId: '8b2c3d4e-5f6a-4b7c-9d1e-2f3a4b5c6d7e',
    displayName: 'Kong API Gateway',
    description: 'API gateway providing ingress routing, rate limiting and authentication.',
    version: { version: '3.6.1', availableFrom: '2026-03-15T00:00:00Z' },
    abstract: false,
    annotations: {
      'emeland.io/p1-system-template-source': 'helm:kong/kong:3.6.1',
      'emeland.io/owner': 'infra-team',
    },
  },
  {
    systemId: '9c3d4e5f-6a7b-4c8d-1e2f-3a4b5c6d7e8f',
    displayName: 'Grafana',
    description: 'Observability dashboards and alerting. Consumes Prometheus metrics API.',
    version: { version: '11.1.0', availableFrom: '2026-02-20T00:00:00Z' },
    abstract: false,
    annotations: {
      'emeland.io/p1-system-template-source': 'helm:grafana/grafana:11.1.0',
      'emeland.io/owner': 'obs-team',
    },
  },
  {
    systemId: 'a4d5e6f7-8b9c-4d1e-2f3a-4b5c6d7e8f9a',
    displayName: 'Prometheus',
    description: 'Time-series metrics collection and storage. Exposes PromQL query API.',
    version: { version: '2.53.0', availableFrom: '2026-03-01T00:00:00Z' },
    abstract: false,
    annotations: {
      'emeland.io/p1-system-template-source': 'helm:prometheus-community/prometheus:2.53.0',
      'emeland.io/owner': 'obs-team',
    },
  },
  {
    systemId: 'b5e6f7a8-9c1d-4e2f-3a4b-5c6d7e8f9a1b',
    displayName: 'Prometheus Operator',
    description: 'Manages Prometheus instances, ServiceMonitors and alerting rules via CRDs.',
    version: { version: '0.75.0', availableFrom: '2026-03-01T00:00:00Z' },
    abstract: false,
    annotations: {
      'emeland.io/p1-system-template-source':
        'helm:prometheus-community/kube-prometheus-stack:0.75.0',
      'emeland.io/owner': 'obs-team',
    },
  },
  {
    systemId: 'c6f7a8b9-1d2e-4f3a-4b5c-6d7e8f9a1b2c',
    displayName: 'DNS Service',
    description: 'External DNS resolution. Abstract system — only the API is known.',
    version: { version: '1.0.0' },
    abstract: true,
    annotations: { 'emeland.io/p1-system-abstract': 'true', 'emeland.io/owner': 'infra-team' },
  },
  {
    systemId: 'd7a8b9c1-2e3f-4a4b-5c6d-7e8f9a1b2c3d',
    displayName: 'Database Service',
    description: 'Managed PostgreSQL cluster. Abstract system — consumed via connection API.',
    version: { version: '16.2.0' },
    abstract: true,
    annotations: { 'emeland.io/p1-system-abstract': 'true', 'emeland.io/owner': 'infra-team' },
  },
]

/**
 * System Instances
 *
 * References:
 *   - systems above
 *   - contexts from contexts.ts (real BWI contexts):
 *       Berlin (prod region):   0a000000-0000-4211-8000-000000000004
 *       Production (prod env):  a157790b-33ce-4ca8-9844-32386da44b6c
 *
 * IDs referenced by:
 *   - ComponentInstances (systemInstance field)
 *   - ApiInstances (systemInstance field)
 *   - Findings in findings.ts
 */
export const systemInstances: SystemInstance[] = [
  {
    systemInstanceId: 'e8b9c1d2-3f4a-4b5c-6d7e-8f9a1b2c3d4e',
    displayName: 'Application (prod-eu)',
    system: '7a1b2c3d-4e5f-4a6b-8c9d-1e2f3a4b5c6d', // Application
    context: '0a000000-0000-4211-8000-000000000004', // Berlin (prod region)
    annotations: {
      'eximpl.emeland.io/last-seen': '2026-05-28T09:24:11Z',
      'emeland.io/cluster': 'ber-prod',
      'emeland.io/namespace': 'app',
    },
  },
  {
    systemInstanceId: 'f9c1d2e3-4a5b-4c6d-7e8f-9a1b2c3d4e5f',
    displayName: 'Kong (prod-eu)',
    system: '8b2c3d4e-5f6a-4b7c-9d1e-2f3a4b5c6d7e', // Kong
    context: '0a000000-0000-4211-8000-000000000004', // Berlin (prod region)
    annotations: {
      'eximpl.emeland.io/last-seen': '2026-05-28T09:24:08Z',
      'emeland.io/cluster': 'ber-prod',
      'emeland.io/namespace': 'kong',
    },
  },
  {
    systemInstanceId: '1a2b3c4d-5e6f-4a7b-8c9d-1e2f3a4b5c6d',
    displayName: 'Grafana (prod)',
    system: '9c3d4e5f-6a7b-4c8d-1e2f-3a4b5c6d7e8f', // Grafana
    context: 'a157790b-33ce-4ca8-9844-32386da44b6c', // Production
    annotations: {
      'eximpl.emeland.io/last-seen': '2026-05-28T09:23:55Z',
      'emeland.io/cluster': 'ber-prod',
      'emeland.io/namespace': 'monitoring',
    },
  },
  {
    systemInstanceId: '2b3c4d5e-6f7a-4b8c-9d1e-2f3a4b5c6d7e',
    displayName: 'Prometheus (prod)',
    system: 'a4d5e6f7-8b9c-4d1e-2f3a-4b5c6d7e8f9a', // Prometheus
    context: 'a157790b-33ce-4ca8-9844-32386da44b6c', // Production
    annotations: {
      'eximpl.emeland.io/last-seen': '2026-05-28T09:24:01Z',
      'emeland.io/cluster': 'ber-prod',
      'emeland.io/namespace': 'monitoring',
    },
  },
  {
    systemInstanceId: '3c4d5e6f-7a8b-4c9d-1e2f-3a4b5c6d7e8f',
    displayName: 'Prometheus Operator (prod)',
    system: 'b5e6f7a8-9c1d-4e2f-3a4b-5c6d7e8f9a1b', // Prometheus Operator
    context: 'a157790b-33ce-4ca8-9844-32386da44b6c', // Production
    annotations: {
      'eximpl.emeland.io/last-seen': '2026-05-28T09:24:03Z',
      'emeland.io/cluster': 'ber-prod',
      'emeland.io/namespace': 'monitoring',
    },
  },
]