/**
 * Guided YAML editor resource-type catalog.
 *
 * Field shapes follow `emelandctl create` / modelsrv ingress documents
 * (`version` / `kind` / `spec`), not the GET wire types one-for-one.
 */
import type { ZodType } from 'zod'
import {
  zApiSpec,
  zCapabilitySpec,
  zComponentSpec,
  zContextSpec,
  zContextTypeSpec,
  zMetricInstanceSpec,
  zMetricSpec,
  zNodeSpec,
  zNodeTypeSpec,
  zParameterSpec,
  zSystemInstanceSpec,
  zSystemSpec,
  zThresholdSpec,
} from './schemas'

export const DOCUMENT_VERSION = 'emeland.io/v1'

export type FieldType = 'string' | 'boolean' | 'enum' | 'uuid' | 'annotations' | 'stringList'

export interface FieldDef {
  key: string
  label: string
  type: FieldType
  required?: boolean
  description?: string
  enumValues?: readonly string[]
  /**
   * When set, this UUID field references another resource type.
   * Bundle documents of that type are offered as form suggestions.
   */
  refType?: string
}

export interface ResourceTypeDef {
  /** Value written as the YAML document `kind` field (modelsrv ingress). */
  resourceType: string
  label: string
  description: string
  idField: string
  fields: FieldDef[]
  schema: ZodType
  formHint?: string
}

const commonId = (key: string, label: string): FieldDef => ({
  key,
  label,
  type: 'uuid',
  required: true,
  description: 'Pre-filled like emelandctl create (minted UUID); edit if you need a specific id',
})

const displayName: FieldDef = {
  key: 'displayName',
  label: 'Display name',
  type: 'string',
  required: true,
}

const description: FieldDef = {
  key: 'description',
  label: 'Description',
  type: 'string',
}

const annotations: FieldDef = {
  key: 'annotations',
  label: 'Annotations',
  type: 'annotations',
  description: 'Key/value map written as a YAML mapping (ingress format)',
}

export const RESOURCE_TYPE_DEFS: ResourceTypeDef[] = [
  {
    resourceType: 'System',
    label: 'System',
    description: 'High-level landscape system',
    idField: 'systemId',
    schema: zSystemSpec,
    fields: [
      commonId('systemId', 'System ID'),
      displayName,
      description,
      {
        key: 'abstract',
        label: 'Abstract',
        type: 'boolean',
        required: true,
        description: 'Whether this is an abstract system definition',
      },
      { key: 'parent', label: 'Parent system', type: 'uuid', description: 'Parent system UUID', refType: 'System' },
      annotations,
    ],
    formHint: 'Optional version lifecycle dates can be added in YAML mode under spec.version.',
  },
  {
    resourceType: 'Context',
    label: 'Context',
    description: 'Grouping context (env, region, …)',
    idField: 'contextId',
    schema: zContextSpec,
    fields: [
      commonId('contextId', 'Context ID'),
      displayName,
      description,
      {
        key: 'type',
        label: 'Context type',
        type: 'uuid',
        required: true,
        description: 'ContextType UUID',
        refType: 'ContextType',
      },
      { key: 'parent', label: 'Parent context', type: 'uuid', refType: 'Context' },
      annotations,
    ],
  },
  {
    resourceType: 'ContextType',
    label: 'Context type',
    description: 'Vocabulary for context categorization',
    idField: 'contextTypeId',
    schema: zContextTypeSpec,
    fields: [commonId('contextTypeId', 'Context type ID'), displayName, description, annotations],
  },
  {
    resourceType: 'Node',
    label: 'Node',
    description: 'Landscape execution node',
    idField: 'nodeId',
    schema: zNodeSpec,
    fields: [
      commonId('nodeId', 'Node ID'),
      displayName,
      description,
      {
        key: 'nodeType',
        label: 'Node type',
        type: 'uuid',
        required: true,
        description: 'NodeType UUID',
        refType: 'NodeType',
      },
      annotations,
    ],
  },
  {
    resourceType: 'NodeType',
    label: 'Node type',
    description: 'Vocabulary for node kinds',
    idField: 'nodeTypeId',
    schema: zNodeTypeSpec,
    fields: [commonId('nodeTypeId', 'Node type ID'), displayName, description, annotations],
  },
  {
    resourceType: 'Component',
    label: 'Component',
    description: 'Software component belonging to a system',
    idField: 'componentId',
    schema: zComponentSpec,
    fields: [
      commonId('componentId', 'Component ID'),
      displayName,
      description,
      {
        key: 'system',
        label: 'System',
        type: 'uuid',
        required: true,
        description: 'Owning system UUID',
        refType: 'System',
      },
      {
        key: 'consumes',
        label: 'Consumes',
        type: 'stringList',
        description: 'API UUIDs this component consumes',
        refType: 'API',
      },
      {
        key: 'provides',
        label: 'Provides',
        type: 'stringList',
        description: 'API UUIDs this component provides',
        refType: 'API',
      },
      annotations,
    ],
  },
  {
    resourceType: 'API',
    label: 'API',
    description: 'API offered by a system',
    idField: 'apiId',
    schema: zApiSpec,
    fields: [
      commonId('apiId', 'API ID'),
      displayName,
      description,
      {
        key: 'type',
        label: 'API type',
        type: 'enum',
        required: true,
        enumValues: ['Unknown', 'OpenAPI', 'GraphQL', 'gRPC', 'Other'],
      },
      {
        key: 'system',
        label: 'System',
        type: 'uuid',
        description: 'Owning system UUID',
        refType: 'System',
      },
      annotations,
    ],
  },
  {
    resourceType: 'Capability',
    label: 'Capability',
    description: 'Technical building block with versioned lifecycle',
    idField: 'capabilityId',
    schema: zCapabilitySpec,
    fields: [commonId('capabilityId', 'Capability ID'), displayName, annotations],
    formHint:
      'Capability versions, variants, and dependencies are structured — switch to YAML to edit them.',
  },
  {
    resourceType: 'Parameter',
    label: 'Parameter',
    description: 'Discrete parameter vocabulary',
    idField: 'parameterId',
    schema: zParameterSpec,
    fields: [
      commonId('parameterId', 'Parameter ID'),
      displayName,
      {
        key: 'values',
        label: 'Values',
        type: 'stringList',
        description: 'Allowed discrete values',
      },
      annotations,
    ],
  },
  {
    resourceType: 'SystemInstance',
    label: 'System instance',
    description: 'Concrete system deployment in a context',
    idField: 'instanceId',
    schema: zSystemInstanceSpec,
    fields: [
      commonId('instanceId', 'Instance ID'),
      displayName,
      { key: 'system', label: 'System', type: 'uuid', required: true, refType: 'System' },
      { key: 'context', label: 'Context', type: 'uuid', refType: 'Context' },
      annotations,
    ],
  },
  {
    resourceType: 'Metric',
    label: 'Metric',
    description: 'Abstract measurement vocabulary',
    idField: 'metricId',
    schema: zMetricSpec,
    fields: [commonId('metricId', 'Metric ID'), displayName, description, annotations],
  },
  {
    resourceType: 'MetricInstance',
    label: 'Metric instance',
    description: 'Metric bound to a subject',
    idField: 'metricInstanceId',
    schema: zMetricInstanceSpec,
    fields: [
      commonId('metricInstanceId', 'Metric instance ID'),
      displayName,
      description,
      {
        key: 'metric',
        label: 'Metric',
        type: 'uuid',
        required: true,
        description: 'Metric UUID',
        refType: 'Metric',
      },
      annotations,
    ],
    formHint: 'Optional subject binding can be added in YAML under spec.subject.',
  },
  {
    resourceType: 'Threshold',
    label: 'Threshold',
    description: 'Condition attached to a metric instance',
    idField: 'thresholdId',
    schema: zThresholdSpec,
    fields: [
      commonId('thresholdId', 'Threshold ID'),
      displayName,
      description,
      {
        key: 'metricInstanceRef',
        label: 'Metric instance',
        type: 'uuid',
        required: true,
        description: 'MetricInstance UUID (stored as metricInstanceRef.metricInstanceId)',
        refType: 'MetricInstance',
      },
      annotations,
    ],
    formHint:
      'Threshold expressions live in annotations (emeland.io/threshold.expression). The form maps metric instance to metricInstanceRef.',
  },
]

export const RESOURCE_TYPE_BY_NAME = Object.fromEntries(RESOURCE_TYPE_DEFS.map((k) => [k.resourceType, k])) as Record<
  string,
  ResourceTypeDef
>

export function newId(): string {
  return crypto.randomUUID()
}

export function blankDocument(resourceType: string): { version: string; kind: string; spec: Record<string, unknown> } {
  const def = RESOURCE_TYPE_BY_NAME[resourceType] ?? RESOURCE_TYPE_DEFS[0]!
  const spec: Record<string, unknown> = {}

  for (const field of def.fields) {
    if (field.type === 'uuid' && field.key === def.idField) {
      spec[field.key] = newId()
    } else if (field.key === 'displayName') {
      spec.displayName = `New ${def.label}`
    } else if (field.type === 'boolean' && field.required) {
      spec[field.key] = false
    } else if (field.type === 'enum' && field.required && field.enumValues?.length) {
      spec[field.key] = field.enumValues[0]
    } else if (field.type === 'annotations') {
      spec.annotations = {}
    } else if (field.type === 'stringList') {
      // omit empty lists
    }
  }

  // Threshold stores metricInstanceRef nested in YAML; form keeps a flat UUID.

  return { version: DOCUMENT_VERSION, kind: def.resourceType, spec }
}
