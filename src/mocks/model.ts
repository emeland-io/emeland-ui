import type { Model } from '@/types/model'

export const model: Model = {
  modelId: 'a1b2c3d4-e5f6-4a7b-8c9d-1e2f3a4b5c6d',
  displayName: 'emeland-prod',
  description: 'Production EmELand landscape.',
  baseUrl: 'https://prod.emeland.local/v1',
  environment: 'prod',
  version: 'v0.1.0',
  status: 'online',
  host: 'prod.emeland.local',
  region: 'eu-central',
  annotations: {
    'eximpl.emeland.io/cluster': 'emeland-prod-1',
  },
}
