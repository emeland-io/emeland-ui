import type { Parameter as ParameterWire } from '@/api/gen/types.gen'

/** wire + the diagram's description, not yet in the modelsrv spec */
type ParameterWireWithDescription = ParameterWire & { description?: string }

/**
 * Parameter mockups (wire format). Parameters define the value sets that
 * capabilities offer; orders bind one value per parameter.
 *
 * The value sets live on the ValidValue resources (validValues.ts) and are
 * joined on load. Values are architectural upper bounds, not exact allocations (per the Phase 3
 * model docs: "8 GB RAM" signals an acceptable design limit). Parameters with
 * the same ParameterId mean exactly the same across capabilities — e.g. "Data
 * residency" is shared by the mail, database and object storage offerings.
 */
export const parameters = [
  {
    parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p101',
    displayName: 'Max concurrent users',
    description: 'How many users the offering serves at once',
    annotations: [],
  },
  {
    parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p102',
    displayName: 'Data residency',
    description: 'Where data may be stored and processed',
    annotations: [],
  },
  {
    parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p103',
    displayName: 'Cluster size',
    description: 'T-shirt size of the workload cluster',
    annotations: [],
  },
  {
    parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p104',
    displayName: 'Rule scope',
    description: 'Which ports or protocols the rule covers',
    annotations: [],
  },
  {
    parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p105',
    displayName: 'Storage capacity',
    description: 'Usable quota of the storage allocation',
    annotations: [],
  },
  {
    parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p106',
    displayName: 'Instance size',
    description: 'Compute profile of the instance',
    annotations: [],
  },
  {
    parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p107',
    displayName: 'High availability',
    description: 'Failure-domain spread of the deployment',
    annotations: [],
  },
  {
    parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p108',
    displayName: 'Metrics retention',
    description: 'How long metrics stay queryable',
    annotations: [],
  },
  {
    parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p109',
    displayName: 'Storage class',
    description: 'Performance tier of the underlying volumes',
    annotations: [],
  },
  {
    parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p110',
    displayName: 'Kubernetes version',
    description: 'Minor release line the control plane runs',
    annotations: [],
  },
  {
    parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p111',
    displayName: 'Node count',
    description: 'Upper bound of worker nodes in the pool',
    annotations: [],
  },
  {
    parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p112',
    displayName: 'Node profile',
    description: 'Hardware profile of the worker nodes',
    annotations: [],
  },
  {
    parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p113',
    displayName: 'Concurrent CI jobs',
    description: 'How many pipeline jobs may run at once',
    annotations: [],
  },
] satisfies ParameterWireWithDescription[]
