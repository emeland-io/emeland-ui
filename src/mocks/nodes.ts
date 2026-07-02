import type { Node, NodeType } from '@/types/node'

export const nodeTypes: NodeType[] = [
  {
    nodeTypeId: 'd1e2f3a4-b5c6-4d7e-8f9a-1b2c3d4e5f6a',
    displayName: 'Sensor',
    description: 'A node that observes a source system and emits change events into the pipeline.',
    annotations: {},
  },
  {
    nodeTypeId: 'e2f3a4b5-c6d7-4e8f-9a1b-2c3d4e5f6a7b',
    displayName: 'Filter',
    description: 'A node that transforms or filters events flowing through the pipeline.',
    annotations: {},
  },
  {
    nodeTypeId: 'f3a4b5c6-d7e8-4f9a-1b2c-3d4e5f6a7b8c',
    displayName: 'Injector',
    description: 'A node that delivers processed events to a target system.',
    annotations: {},
  },
  {
    nodeTypeId: 'a4b5c6d7-e8f9-4a1b-2c3d-4e5f6a7b8c9d',
    displayName: 'External',
    description: 'A node representing an external system outside the managed landscape.',
    annotations: {},
  },
]

export const nodes: Node[] = [
  {
    nodeId: 'b1c2d3e4-f5a6-4b7c-8d9e-1f2a3b4c5d6e',
    displayName: 'Sensor System A',
    nodeType: { nodeTypeId: 'd1e2f3a4-b5c6-4d7e-8f9a-1b2c3d4e5f6a', displayName: 'Sensor' },
    annotations: {
      'eximpl.emeland.io/version': 'v1.2.0',
      'eximpl.emeland.io/mode': 'scan',
      'eximpl.emeland.io/interval': '30s',
    },
  },
  {
    nodeId: 'c2d3e4f5-a6b7-4c8d-9e1f-2a3b4c5d6e7f',
    displayName: 'Sensor System B',
    nodeType: { nodeTypeId: 'd1e2f3a4-b5c6-4d7e-8f9a-1b2c3d4e5f6a', displayName: 'Sensor' },
    annotations: {
      'eximpl.emeland.io/version': 'v1.1.4',
      'eximpl.emeland.io/mode': 'subscribe',
      'eximpl.emeland.io/service': 'kafka',
    },
  },
  {
    nodeId: 'd3e4f5a6-b7c8-4d9e-1f2a-3b4c5d6e7f8a',
    displayName: 'Filter Format Y',
    nodeType: { nodeTypeId: 'e2f3a4b5-c6d7-4e8f-9a1b-2c3d4e5f6a7b', displayName: 'Filter' },
    annotations: {
      'eximpl.emeland.io/version': 'v1.1.2',
      'eximpl.emeland.io/mode': 'transform',
    },
  },
  {
    nodeId: 'e4f5a6b7-c8d9-4e1f-2a3b-4c5d6e7f8a9b',
    displayName: 'Injector Target 1',
    nodeType: { nodeTypeId: 'f3a4b5c6-d7e8-4f9a-1b2c-3d4e5f6a7b8c', displayName: 'Injector' },
    annotations: {
      'eximpl.emeland.io/version': 'v1.0.0',
      'eximpl.emeland.io/type': 'sink',
    },
  },
  {
    nodeId: 'f5a6b7c8-d9e1-4f2a-3b4c-5d6e7f8a9b1c',
    displayName: 'External System C',
    nodeType: { nodeTypeId: 'a4b5c6d7-e8f9-4a1b-2c3d-4e5f6a7b8c9d', displayName: 'External' },
    annotations: {
      'eximpl.emeland.io/type': 'event-stream',
    },
  },
  {
    nodeId: 'aaaa0001-0000-4000-8000-000000000001',
    displayName: 'orphan-git-sensor',
    description: 'References a non-existent NodeType to trigger NodeTypeMissing.',
    nodeType: { nodeTypeId: 'bbbb0001-0000-4000-8000-000000000001', displayName: '' },
    annotations: {},
  },
]