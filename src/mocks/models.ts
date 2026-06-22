import type { ModelInstance } from '@/types/model'

/**
 * Model instance mocks
 *
 * TODO:
 * INFO // WORK IN PROGRESS: The approach for instance discovery is not finalized yet.
 * For now, instances are discovered from configuration or similar sources,
 * since the OpenAPI specification currently lacks an instance-list endpoint.
 */
export const models: ModelInstance[] = [
  {
    modelId: 'a1b2c3d4-e5f6-4a7b-8c9d-1e2f3a4b5c6d',
    displayName: 'emeland-prod',
    description: 'Production landscape.',
    baseUrl: 'https://prod.emeland.io/v1',
    environment: 'prod',
    version: 'v0.1.0',
    status: 'online',
    annotations: {
      'eximpl.emeland.io/region': 'de-frankfurt',
    },
  },
  {
    modelId: 'b2c3d4e5-f6a7-4b8c-9d1e-2f3a4b5c6d7e',
    displayName: 'emeland-staging',
    description: 'Staging landscape for pre-release validation',
    baseUrl: 'https://staging.emeland.io/v1',
    environment: 'staging',
    version: 'v0.1.0',
    status: 'online',
    annotations: {
      'eximpl.emeland.io/region': 'de-frankfurt',
    },
  },
  {
    modelId: 'c3d4e5f6-a7b8-4c9d-1e2f-3a4b5c6d7e8f',
    displayName: 'emeland-demo',
    description: 'Demo landscape',
    baseUrl: 'https://demo.emeland.io/v1',
    environment: 'dev',
    version: 'v0.0.9',
    status: 'offline',
  },
]
