import type { Parameter as ParameterWire } from '@/api/gen/types.gen'

/** wire + the diagram's description, not yet in the modelsrv spec */
type ParameterWireWithDescription = ParameterWire & { description?: string }

/**
 * Parameter mockups (wire format). Parameters define the value sets that
 * capabilities offer; orders bind one value per parameter.
 *
 * Values are architectural upper bounds, not exact allocations (per the Phase 3
 * model docs: "8 GB RAM" signals an acceptable design limit). Parameters with
 * the same ParameterId mean exactly the same across capabilities — e.g. "Data
 * residency" is shared by the mail, database and object storage offerings.
 */
export const parameters = [
  {
    parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p101',
    displayName: 'Max concurrent users',
    description: 'How many users the offering serves at once',
    values: ['10 users', '100 users', '1000 users'],
    annotations: [],
  },
  {
    parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p102',
    displayName: 'Data residency',
    description: 'Where data may be stored and processed',
    values: ['Germany'],
    annotations: [],
  },
  {
    parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p103',
    displayName: 'Cluster size',
    description: 'T-shirt size of the workload cluster',
    values: ['small', 'medium', 'large'],
    annotations: [],
  },
  {
    parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p104',
    displayName: 'Rule scope',
    description: 'Which ports or protocols the rule covers',
    values: ['port 443 only', 'any port'],
    annotations: [],
  },
  {
    parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p105',
    displayName: 'Storage capacity',
    description: 'Usable quota of the storage allocation',
    values: ['50 GB', '250 GB', '1 TB'],
    annotations: [],
  },
  {
    parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p106',
    displayName: 'Instance size',
    description: 'Compute profile of the instance',
    values: ['small (2 vCPU, 8 GB RAM)', 'medium (4 vCPU, 16 GB RAM)', 'large (8 vCPU, 32 GB RAM)'],
    annotations: [],
  },
  {
    parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p107',
    displayName: 'High availability',
    description: 'Failure-domain spread of the deployment',
    values: ['single-zone', 'multi-zone'],
    annotations: [],
  },
  {
    parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p108',
    displayName: 'Metrics retention',
    description: 'How long metrics stay queryable',
    values: ['7 days', '30 days', '90 days'],
    annotations: [],
  },
  {
    parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p109',
    displayName: 'Storage class',
    description: 'Performance tier of the underlying volumes',
    values: ['standard', 'archive'],
    annotations: [],
  },
  {
    parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p110',
    displayName: 'Kubernetes version',
    description: 'Minor release line the control plane runs',
    values: ['1.31', '1.32', '1.33'],
    annotations: [],
  },
  {
    parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p111',
    displayName: 'Node count',
    description: 'Upper bound of worker nodes in the pool',
    values: ['3 nodes', '6 nodes', '12 nodes'],
    annotations: [],
  },
  {
    parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p112',
    displayName: 'Node profile',
    description: 'Hardware profile of the worker nodes',
    values: [
      'general (4 vCPU, 16 GB RAM)',
      'compute (16 vCPU, 64 GB RAM)',
      'gpu (8 vCPU, 64 GB RAM, 1x L40S)',
    ],
    annotations: [],
  },
  {
    parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p113',
    displayName: 'Concurrent CI jobs',
    description: 'How many pipeline jobs may run at once',
    values: ['5 jobs', '20 jobs'],
    annotations: [],
  },
] satisfies ParameterWireWithDescription[]
