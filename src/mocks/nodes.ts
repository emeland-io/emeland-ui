import type { NodeView as NodeViewWire, NodeType as NodeTypeWire } from '@/api/gen/types.gen'

export const nodeTypes = [
  {
    nodeTypeId: 'd1e2f3a4-b5c6-4d7e-8f9a-1b2c3d4e5f6a',
    displayName: 'Sensor',
    description: 'A node that observes a source system and emits change events into the pipeline.',
    annotations: [],
  },
  {
    nodeTypeId: 'e2f3a4b5-c6d7-4e8f-9a1b-2c3d4e5f6a7b',
    displayName: 'Filter',
    description: 'A node that transforms or filters events flowing through the pipeline.',
    annotations: [],
  },
  {
    nodeTypeId: 'f3a4b5c6-d7e8-4f9a-1b2c-3d4e5f6a7b8c',
    displayName: 'Injector',
    description: 'A node that delivers processed events to a target system.',
    annotations: [],
  },
  {
    nodeTypeId: 'a4b5c6d7-e8f9-4a1b-2c3d-4e5f6a7b8c9d',
    displayName: 'External',
    description: 'A node representing an external system outside the managed landscape.',
    annotations: [],
  },
] satisfies NodeTypeWire[]

export const nodes = [
  {
    nodeId: 'b1c2d3e4-f5a6-4b7c-8d9e-1f2a3b4c5d6e',

    reference: 'emeland://nodeId/b1c2d3e4-f5a6-4b7c-8d9e-1f2a3b4c5d6e',
    displayName: 'Sensor System A',
    nodeType: {
      nodeTypeId: 'd1e2f3a4-b5c6-4d7e-8f9a-1b2c3d4e5f6a',
      resource: 'NodeType',
      displayName: 'Sensor',
    },
    annotations: [
      { key: 'eximpl.emeland.io/version', value: 'v1.2.0' },
      { key: 'eximpl.emeland.io/mode', value: 'scan' },
      { key: 'eximpl.emeland.io/interval', value: '30s' },
    ],
  },
  {
    nodeId: 'c2d3e4f5-a6b7-4c8d-9e1f-2a3b4c5d6e7f',

    reference: 'emeland://nodeId/c2d3e4f5-a6b7-4c8d-9e1f-2a3b4c5d6e7f',
    displayName: 'Sensor System B',
    nodeType: {
      nodeTypeId: 'd1e2f3a4-b5c6-4d7e-8f9a-1b2c3d4e5f6a',
      resource: 'NodeType',
      displayName: 'Sensor',
    },
    annotations: [
      { key: 'eximpl.emeland.io/version', value: 'v1.1.4' },
      { key: 'eximpl.emeland.io/mode', value: 'subscribe' },
      { key: 'eximpl.emeland.io/service', value: 'kafka' },
    ],
  },
  {
    nodeId: 'd3e4f5a6-b7c8-4d9e-1f2a-3b4c5d6e7f8a',

    reference: 'emeland://nodeId/d3e4f5a6-b7c8-4d9e-1f2a-3b4c5d6e7f8a',
    displayName: 'Filter Format Y',
    nodeType: {
      nodeTypeId: 'e2f3a4b5-c6d7-4e8f-9a1b-2c3d4e5f6a7b',
      resource: 'NodeType',
      displayName: 'Filter',
    },
    annotations: [
      { key: 'eximpl.emeland.io/version', value: 'v1.1.2' },
      { key: 'eximpl.emeland.io/mode', value: 'transform' },
    ],
  },
  {
    nodeId: 'e4f5a6b7-c8d9-4e1f-2a3b-4c5d6e7f8a9b',

    reference: 'emeland://nodeId/e4f5a6b7-c8d9-4e1f-2a3b-4c5d6e7f8a9b',
    displayName: 'Injector Target 1',
    nodeType: {
      nodeTypeId: 'f3a4b5c6-d7e8-4f9a-1b2c-3d4e5f6a7b8c',
      resource: 'NodeType',
      displayName: 'Injector',
    },
    annotations: [
      { key: 'eximpl.emeland.io/version', value: 'v1.0.0' },
      { key: 'eximpl.emeland.io/type', value: 'sink' },
    ],
  },
  {
    nodeId: 'f5a6b7c8-d9e1-4f2a-3b4c-5d6e7f8a9b1c',

    reference: 'emeland://nodeId/f5a6b7c8-d9e1-4f2a-3b4c-5d6e7f8a9b1c',
    displayName: 'External System C',
    nodeType: {
      nodeTypeId: 'a4b5c6d7-e8f9-4a1b-2c3d-4e5f6a7b8c9d',
      resource: 'NodeType',
      displayName: 'External',
    },
    annotations: [{ key: 'eximpl.emeland.io/type', value: 'event-stream' }],
  },
  {
    nodeId: 'aaaa0001-0000-4000-8000-000000000001',

    reference: 'emeland://nodeId/aaaa0001-0000-4000-8000-000000000001',
    displayName: 'orphan-git-sensor',
    description: 'References a non-existent NodeType to trigger NodeTypeMissing.',
    nodeType: {
      nodeTypeId: 'bbbb0001-0000-4000-8000-000000000001',
      resource: 'NodeType',
      displayName: '',
    },
    annotations: [],
  },
] satisfies NodeViewWire[]
