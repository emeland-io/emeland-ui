import type { ValidValueWire } from '@/api/capabilityGraph'

/**
 * ValidValue mockups (flat landscape resources), grouped per parameter in
 * display order. They are a Parameter's value set (parameters.ts), the
 * vocabulary of Variant.requires / Dependency.mappings, and what order bound
 * values reference (boundValues.ts).
 */
export const validValues = [
  // Max concurrent users
  {
    validValueId: '7ad25102-e2e4-4141-85fb-7feff99c704d',
    displayName: '10 users',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p101',
  },
  {
    validValueId: '7431418a-f31a-486c-8c52-0a10edc86e5f',
    displayName: '100 users',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p101',
  },
  {
    validValueId: '80025a24-422c-4e39-8895-08821a455064',
    displayName: '1000 users',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p101',
  },
  // Data residency
  {
    validValueId: '8bb0ae2f-118c-4fcd-8abc-74bac421430a',
    displayName: 'Germany',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p102',
  },
  // Cluster size
  {
    validValueId: '3301d335-18a4-45aa-80fd-13b596e9c42e',
    displayName: 'small',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p103',
  },
  {
    validValueId: 'a7c391ba-706e-4fe8-8c5a-841e19eaf4b1',
    displayName: 'medium',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p103',
  },
  {
    validValueId: 'b2f0aa22-97d5-4982-bcfd-9eeb08a6bd38',
    displayName: 'large',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p103',
  },
  // Rule scope
  {
    validValueId: '04dca9d2-6247-4937-b7ab-934b89d7e439',
    displayName: 'port 443 only',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p104',
  },
  {
    validValueId: 'ea2ca28c-51e7-46e5-b2a9-2b556df55963',
    displayName: 'any port',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p104',
  },
  // Storage capacity
  {
    validValueId: 'ee0fae56-6cba-4c07-84be-71686e7532e7',
    displayName: '50 GB',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p105',
  },
  {
    validValueId: '2cd57977-fdb7-48a9-838e-d7e52755fb9a',
    displayName: '250 GB',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p105',
  },
  {
    validValueId: '5734764c-0d30-409d-853d-60610c451029',
    displayName: '1 TB',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p105',
  },
  // Instance size
  {
    validValueId: '5d5fa5c1-5c5d-4161-b64c-0b737486c2ba',
    displayName: 'small (2 vCPU, 8 GB RAM)',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p106',
  },
  {
    validValueId: 'f35db06f-f6d4-42a2-abfd-8f4a8a1681fd',
    displayName: 'medium (4 vCPU, 16 GB RAM)',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p106',
  },
  {
    validValueId: '96823847-d1cc-4573-8cc3-576ca401e566',
    displayName: 'large (8 vCPU, 32 GB RAM)',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p106',
  },
  // High availability
  {
    validValueId: '1a2931d5-983c-4df6-8ad4-b76ff5d210b9',
    displayName: 'single-zone',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p107',
  },
  {
    validValueId: '29a0a175-f21e-456f-89a4-0b2ef4fe7f13',
    displayName: 'multi-zone',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p107',
  },
  // Metrics retention
  {
    validValueId: '53bd4390-d313-4ca4-8707-eb9b0ee149bd',
    displayName: '7 days',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p108',
  },
  {
    validValueId: '74df44fe-3994-4501-8365-8254cd48bbd2',
    displayName: '30 days',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p108',
  },
  {
    validValueId: 'dab0239a-276c-4e65-9de9-c2985de2cb05',
    displayName: '90 days',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p108',
  },
  // Storage class
  {
    validValueId: '3d05c9c3-97b2-4e5f-8d2f-c1b8eedec16e',
    displayName: 'standard',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p109',
  },
  {
    validValueId: '8390f398-91b0-45b1-9add-3c92e21b2954',
    displayName: 'archive',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p109',
  },
  // Kubernetes version
  {
    validValueId: '913612a4-2930-4311-bf02-cb3aebe4e6cd',
    displayName: '1.31',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p110',
  },
  {
    validValueId: '60cc1bfc-e5cd-4ee9-8d84-1a8de989dd6f',
    displayName: '1.32',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p110',
  },
  {
    validValueId: '71617bb2-dc33-45ba-8574-b1b98201b7f5',
    displayName: '1.33',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p110',
  },
  // Node count
  {
    validValueId: '382c087f-9625-443e-87ee-e40d3f5d2974',
    displayName: '3 nodes',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p111',
  },
  {
    validValueId: 'a8d9fc3d-f869-4535-8a39-cf8ec06ffe9a',
    displayName: '6 nodes',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p111',
  },
  {
    validValueId: 'e44ecd8b-07c3-4a82-8c4d-f985f0f424fc',
    displayName: '12 nodes',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p111',
  },
  // Node profile
  {
    validValueId: '1c3b5e16-dce8-4f07-8369-b88df6611702',
    displayName: 'general (4 vCPU, 16 GB RAM)',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p112',
  },
  {
    validValueId: '33337a1d-ba4f-493a-8452-27ab869487a3',
    displayName: 'compute (16 vCPU, 64 GB RAM)',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p112',
  },
  {
    validValueId: '2cce91f1-9a1f-4359-8c0d-c87e608f9a36',
    displayName: 'gpu (8 vCPU, 64 GB RAM, 1x L40S)',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p112',
  },
  // Concurrent CI jobs
  {
    validValueId: '5c11591c-3c8c-4e88-840a-0b1b155e9e8f',
    displayName: '5 jobs',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p113',
  },
  {
    validValueId: '6499a569-feda-4a43-8295-f200c98eec2b',
    displayName: '20 jobs',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p113',
  },
] satisfies ValidValueWire[]
