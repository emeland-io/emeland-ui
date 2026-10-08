import type { ValidValueWire } from '@/api/capabilityGraph'

/**
 * ValidValue mockups (flat landscape resources). Used when mapping Variant.requires
 * and Dependency.mappings into UI inputParameters / outputParameters
 */
export const validValues = [
  {
    validValueId: '7ad25102-e2e4-4141-85fb-7feff99c704d',
    displayName: '10 users',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p101',
  },
  {
    validValueId: '8bb0ae2f-118c-4fcd-8abc-74bac421430a',
    displayName: 'Germany',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p102',
  },
  {
    validValueId: 'ee0fae56-6cba-4c07-84be-71686e7532e7',
    displayName: '50 GB',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p105',
  },
  {
    validValueId: '80025a24-422c-4e39-8895-08821a455064',
    displayName: '1000 users',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p101',
  },
  {
    validValueId: '2cd57977-fdb7-48a9-838e-d7e52755fb9a',
    displayName: '250 GB',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p105',
  },
  {
    validValueId: '29a0a175-f21e-456f-89a4-0b2ef4fe7f13',
    displayName: 'multi-zone',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p107',
  },
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
    validValueId: '60cc1bfc-e5cd-4ee9-8d84-1a8de989dd6f',
    displayName: '1.32',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p110',
  },
  {
    validValueId: '71617bb2-dc33-45ba-8574-b1b98201b7f5',
    displayName: '1.33',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p110',
  },
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
    validValueId: '1c3b5e16-dce8-4f07-8369-b88df6611702',
    displayName: 'general (4 vCPU, 16 GB RAM)',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p112',
  },
  {
    validValueId: '1a2931d5-983c-4df6-8ad4-b76ff5d210b9',
    displayName: 'single-zone',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p107',
  },
  {
    validValueId: 'e44ecd8b-07c3-4a82-8c4d-f985f0f424fc',
    displayName: '12 nodes',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p111',
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
  {
    validValueId: '5734764c-0d30-409d-853d-60610c451029',
    displayName: '1 TB',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p105',
  },
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
    validValueId: '3d05c9c3-97b2-4e5f-8d2f-c1b8eedec16e',
    displayName: 'standard',
    parameter: '5b6c7d8e-0001-4e5f-9a1b-00000000p109',
  },
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
