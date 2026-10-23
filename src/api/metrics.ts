import { API } from '@/constants/api'
import type { Metric, MetricInstance, MetricValue, Threshold } from '@/types/metric'
import { decodeAnnotations, decodeResourceType } from './decode'
import { MINIMAL_LIST_FIELDS, makeResourceApi, responseId } from './resource'
import type {
  Metric as MetricWire,
  MetricInstance as MetricInstanceWire,
  MetricValue as MetricValueWire,
  Threshold as ThresholdWire,
} from './gen/types.gen'
import {
  zInstanceListItem,
  zMetric,
  zMetricInstance,
  zMetricValue,
  zThreshold,
} from './gen/zod.gen'

function decodeMetric(res: MetricWire): Metric {
  return {
    metricId: responseId(res, 'metricId'),
    displayName: res.displayName ?? '',
    description: res.description ?? '',
    annotations: decodeAnnotations(res.annotations),
  }
}

const metrics = makeResourceApi<Metric, MetricWire>({
  name: 'Metric',
  namePlural: 'metrics',
  listPath: API.METRICS.list,
  byIdPath: API.METRICS.byId,
  mocks: async () => (await import('@/mocks/metrics')).metrics,
  idKey: 'metricId',
  idOf: (m) => m.metricId,
  listSchema: zInstanceListItem,
  requireListFields: MINIMAL_LIST_FIELDS,
  responseSchema: zMetric,
  decode: decodeMetric,
})

export const fetchMetrics = metrics.fetchAll
export const fetchMetricById = metrics.fetchById

function decodeMetricInstance(res: MetricInstanceWire): MetricInstance {
  return {
    metricInstanceId: responseId(res, 'metricInstanceId'),
    displayName: res.displayName ?? '',
    description: res.description ?? '',
    metricId: res.metricRef?.metricId,
    subject: res.subject
      ? {
          resourceId: res.subject.resourceId,
          resourceType: decodeResourceType(res.subject.resourceType),
        }
      : undefined,
    annotations: decodeAnnotations(res.annotations),
  }
}

const metricInstances = makeResourceApi<MetricInstance, MetricInstanceWire>({
  name: 'Metric instance',
  namePlural: 'metric instances',
  listPath: API.METRIC_INSTANCES.list,
  byIdPath: API.METRIC_INSTANCES.byId,
  mocks: async () => (await import('@/mocks/metrics')).metricInstances,
  idKey: 'metricInstanceId',
  idOf: (i) => i.metricInstanceId,
  listSchema: zInstanceListItem,
  requireListFields: MINIMAL_LIST_FIELDS,
  responseSchema: zMetricInstance,
  decode: decodeMetricInstance,
})

export const fetchMetricInstances = metricInstances.fetchAll
export const fetchMetricInstanceById = metricInstances.fetchById

function decodeThreshold(res: ThresholdWire): Threshold {
  return {
    thresholdId: responseId(res, 'thresholdId'),
    displayName: res.displayName ?? '',
    description: res.description ?? '',
    metricInstanceId: res.metricInstanceRef?.metricInstanceId ?? '',
    annotations: decodeAnnotations(res.annotations),
  }
}

const thresholds = makeResourceApi<Threshold, ThresholdWire>({
  name: 'Threshold',
  namePlural: 'thresholds',
  listPath: API.THRESHOLDS.list,
  byIdPath: API.THRESHOLDS.byId,
  mocks: async () => (await import('@/mocks/metrics')).thresholds,
  idKey: 'thresholdId',
  idOf: (t) => t.thresholdId,
  listSchema: zInstanceListItem,
  requireListFields: MINIMAL_LIST_FIELDS,
  responseSchema: zThreshold,
  decode: decodeThreshold,
})

export const fetchThresholds = thresholds.fetchAll
export const fetchThresholdById = thresholds.fetchById

function decodeMetricValue(res: MetricValueWire): MetricValue {
  return {
    metricValueId: responseId(res, 'metricValueId'),
    displayName: res.displayName ?? '',
    description: res.description ?? '',
    metricInstanceId: res.metricInstanceRef?.metricInstanceId ?? '',
    value: res.value ?? '',
    annotations: decodeAnnotations(res.annotations),
  }
}

const metricValues = makeResourceApi<MetricValue, MetricValueWire>({
  name: 'Metric value',
  namePlural: 'metric values',
  listPath: API.METRIC_VALUES.list,
  byIdPath: API.METRIC_VALUES.byId,
  mocks: async () => (await import('@/mocks/metrics')).metricValues,
  idKey: 'metricValueId',
  idOf: (v) => v.metricValueId,
  listSchema: zInstanceListItem,
  requireListFields: MINIMAL_LIST_FIELDS,
  responseSchema: zMetricValue,
  decode: decodeMetricValue,
})

export const fetchMetricValues = metricValues.fetchAll
export const fetchMetricValueById = metricValues.fetchById
