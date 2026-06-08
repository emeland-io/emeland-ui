import type { ContextType, Context } from '@/types/context'

export const contextTypes: ContextType[] = [
  {
    contextTypeId: 'b9a3e1d4-7f2c-4e8b-a1d6-3c5f9e2b8a4d',
    displayName: 'Organization',
    description: 'Root organizational unit encompassing the entire enterprise landscape.',
    annotations: { 'emeland.io/context-level': 'root' },
  },
  {
    contextTypeId: 'c4d8f2a1-9e3b-4c7d-b5f8-1a6e4d9c2b7f',
    displayName: 'Domain',
    description: 'Business domain or capability area grouping related systems and services.',
    annotations: { 'emeland.io/context-level': 'domain' },
  },
  {
    contextTypeId: 'a7e5b3d9-2c4f-4a1e-8d6b-5f3c9a1e7b2d',
    displayName: 'Environment',
    description: 'Deployment environment distinguishing production, staging and development.',
    annotations: { 'emeland.io/context-level': 'environment' },
  },
]

/**
 * Contexts mockups
 *
 * IDs referenced by:
 *   - SystemInstances in systems.ts (context field)
 *   - Findings in findings.ts (resources[].resourceId)
 */
export const contexts: Context[] = [
  {
    contextId: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    displayName: 'Acme Corp',
    description: 'Root context for the Acme Corp enterprise landscape.',
    type: 'b9a3e1d4-7f2c-4e8b-a1d6-3c5f9e2b8a4d', // Organization
    annotations: { 'emeland.io/owner': 'platform-engineering' },
  },
  {
    contextId: 'e2b4c6d8-f1a3-4e5b-9c7d-2a4f6e8b1d3c',
    displayName: 'CI/CD',
    description:
      'Continuous integration and delivery domain. Build pipelines, artifact registries, deployment automation.',
    type: 'c4d8f2a1-9e3b-4c7d-b5f8-1a6e4d9c2b7f', // Domain
    parent: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', // Acme Corp
    annotations: { 'emeland.io/owner': 'platform-team' },
  },
  {
    contextId: 'd3c5e7f9-a2b4-4d6c-8e1f-3b5a7c9d2e4f',
    displayName: 'Monitoring',
    description: 'Observability and monitoring domain. Prometheus, Grafana and alert pipeline.',
    type: 'c4d8f2a1-9e3b-4c7d-b5f8-1a6e4d9c2b7f', // Domain
    parent: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', // Acme Corp
    annotations: { 'emeland.io/owner': 'obs-team' },
  },
  {
    contextId: 'a1b3c5d7-e9f2-4a4b-8c6d-1e3f5a7b9c2d',
    displayName: 'Infrastructure',
    description: 'Shared infrastructure domain. DNS, databases and platform services.',
    type: 'c4d8f2a1-9e3b-4c7d-b5f8-1a6e4d9c2b7f', // Domain
    parent: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', // Acme Corp
    annotations: { 'emeland.io/owner': 'infra-team' },
  },
  // Environment contexts
  {
    contextId: 'c3e5a7b9-d2f4-4c6e-8a1b-3d5f7a9c2e4b',
    displayName: 'CI/CD Production',
    description: 'Production environment for CI/CD domain. eu-west-1 cluster.',
    type: 'a7e5b3d9-2c4f-4a1e-8d6b-5f3c9a1e7b2d', // Environment
    parent: 'e2b4c6d8-f1a3-4e5b-9c7d-2a4f6e8b1d3c', // CI/CD
    annotations: { 'emeland.io/environment': 'production', 'emeland.io/cluster': 'eu-west-prod' },
  },
  {
    contextId: 'e5a7c9d2-f4b6-4e8a-1c3d-5f7b9a2c4e6d',
    displayName: 'Monitoring Production',
    description: 'Production environment for monitoring infrastructure.',
    type: 'a7e5b3d9-2c4f-4a1e-8d6b-5f3c9a1e7b2d', // Environment
    parent: 'd3c5e7f9-a2b4-4d6c-8e1f-3b5a7c9d2e4f', // Monitoring
    annotations: { 'emeland.io/environment': 'production', 'emeland.io/cluster': 'eu-west-prod' },
  },
]
