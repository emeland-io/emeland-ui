import type { Api } from '@/types/api'

/**
 * APIs mockups
 *
 * IDs referenced by:
 *   - Components in components.ts (consumes/provides arrays)
 *
 * system field references Systems from systems.ts:
 *   Application:      7a1b2c3d-4e5f-4a6b-8c9d-1e2f3a4b5c6d
 *   Kong:             8b2c3d4e-5f6a-4b7c-9d1e-2f3a4b5c6d7e
 *   Grafana:          9c3d4e5f-6a7b-4c8d-1e2f-3a4b5c6d7e8f
 *   Prometheus:       a4d5e6f7-8b9c-4d1e-2f3a-4b5c6d7e8f9a
 *   DNS Service:      c6f7a8b9-1d2e-4f3a-4b5c-6d7e8f9a1b2c
 *   Database Service: d7a8b9c1-2e3f-4a4b-5c6d-7e8f9a1b2c3d
 */
export const apis: Api[] = [
  {
    apiId: 'aa1b2c3d-4e5f-4a6b-8c9d-1e2f3a4b5c6d',
    displayName: 'Command API',
    description:
      'REST API for write operations. Triggers builds, deployments and pipeline actions.',
    version: { version: '1.8.3', availableFrom: '2026-04-01T00:00:00Z' },
    type: 'OpenAPI',
    system: '7a1b2c3d-4e5f-4a6b-8c9d-1e2f3a4b5c6d', // Application
    annotations: { 'emeland.io/owner': 'platform-team' },
  },
  {
    apiId: 'ab2c3d4e-5f6a-4b7c-9d1e-2f3a4b5c6d7e',
    displayName: 'Query API',
    description: 'REST API for read operations. Pipeline status, build history, artifact metadata.',
    version: { version: '1.8.3', availableFrom: '2026-04-01T00:00:00Z' },
    type: 'OpenAPI',
    system: '7a1b2c3d-4e5f-4a6b-8c9d-1e2f3a4b5c6d', // Application
    annotations: { 'emeland.io/owner': 'platform-team' },
  },
  {
    apiId: 'ac3d4e5f-6a7b-4c8d-1e2f-3a4b5c6d7e8f',
    displayName: 'Event Bus',
    description: 'Async event interface for build and deployment lifecycle events. Kafka-based.',
    version: { version: '1.8.3', availableFrom: '2026-04-01T00:00:00Z' },
    type: 'Other',
    system: '7a1b2c3d-4e5f-4a6b-8c9d-1e2f3a4b5c6d', // Application
    annotations: { 'emeland.io/owner': 'platform-team', 'emeland.io/protocol': 'kafka' },
  },
  {
    apiId: 'ad4e5f6a-7b8c-4d9e-1f2a-3b4c5d6e7f8a',
    displayName: 'Public Gateway',
    description: 'Public-facing API gateway endpoint with rate limiting and auth.',
    version: { version: '3.6.1', availableFrom: '2026-03-15T00:00:00Z' },
    type: 'OpenAPI',
    system: '8b2c3d4e-5f6a-4b7c-9d1e-2f3a4b5c6d7e', // Kong
    annotations: { 'emeland.io/owner': 'infra-team' },
  },
  {
    apiId: 'ae5f6a7b-8c9d-4e1f-2a3b-4c5d6e7f8a9b',
    displayName: 'PromQL API',
    description: 'Prometheus query API for metrics querying and alerting evaluation.',
    version: { version: '2.53.0', availableFrom: '2026-03-01T00:00:00Z' },
    type: 'OpenAPI',
    system: 'a4d5e6f7-8b9c-4d1e-2f3a-4b5c6d7e8f9a', // Prometheus
    annotations: { 'emeland.io/owner': 'obs-team' },
  },
  {
    apiId: 'af6a7b8c-9d1e-4f2a-3b4c-5d6e7f8a9b1c',
    displayName: 'Metrics Scrape Endpoint',
    description: 'Prometheus scrape target. Exposes /metrics in OpenMetrics format.',
    version: { version: '2.53.0', availableFrom: '2026-03-01T00:00:00Z' },
    type: 'Other',
    system: 'a4d5e6f7-8b9c-4d1e-2f3a-4b5c6d7e8f9a', // Prometheus
    annotations: { 'emeland.io/owner': 'obs-team', 'emeland.io/protocol': 'openmetrics' },
  },
  {
    apiId: 'ba7b8c9d-1e2f-4a3b-4c5d-6e7f8a9b1c2d',
    displayName: 'Datasource API',
    description: 'Grafana datasource provisioning and query API.',
    version: { version: '11.1.0', availableFrom: '2026-02-20T00:00:00Z' },
    type: 'OpenAPI',
    system: '9c3d4e5f-6a7b-4c8d-1e2f-3a4b5c6d7e8f', // Grafana
    annotations: { 'emeland.io/owner': 'obs-team' },
  },
  {
    apiId: 'bb8c9d1e-2f3a-4b4c-5d6e-7f8a9b1c2d3e',
    displayName: 'DNS Resolve API',
    description: 'DNS name resolution. Provided by external infrastructure.',
    version: { version: '1.0.0' },
    type: 'Other',
    system: 'c6f7a8b9-1d2e-4f3a-4b5c-6d7e8f9a1b2c', // DNS Service
    annotations: { 'emeland.io/protocol': 'dns' },
  },
  {
    apiId: 'bc9d1e2f-3a4b-4c5d-6e7f-8a9b1c2d3e4f',
    displayName: 'PostgreSQL Connection',
    description: 'PostgreSQL wire protocol. Provided by managed database service.',
    version: { version: '16.2.0' },
    type: 'Other',
    system: 'd7a8b9c1-2e3f-4a4b-5c6d-7e8f9a1b2c3d', // Database Service
    annotations: { 'emeland.io/protocol': 'postgres' },
  },
]
