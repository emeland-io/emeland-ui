/**
 * Observability mockups (Phase 6)
 *
 * Subjects reference resources from other mock files:
 *   Nodes (nodes.ts):            Sensor System A  b1c2d3e4-f5a6-4b7c-8d9e-1f2a3b4c5d6e
 *                                Sensor System B  c2d3e4f5-a6b7-4c8d-9e1f-2a3b4c5d6e7f
 *   SystemInstance (systems.ts): Application (prod-eu)  e8b9c1d2-3f4a-4b5c-6d7e-8f9a1b2c3d4e
 *   ApiInstance (api.ts):        Command API (prod-eu)  ea1b2c3d-0000-4d5e-8f00-000000000001
 *
 */
import type {
  Metric as MetricWire,
  MetricInstance as MetricInstanceWire,
  MetricValue as MetricValueWire,
  Threshold as ThresholdWire,
} from '@/api/gen/types.gen'

const M = {
  p99Latency: '11111111-1111-4111-8111-111111111111',
  errorRate: '22222222-2222-4222-8222-222222222222',
  queueDepth: '33333333-3333-4333-8333-333333333333',
}

const MI = {
  ordersApiP99: '44444444-4444-4444-8444-444444444444',
  paymentsApiP99: '55555555-5555-4555-8555-555555555555',
  ordersErrorRate: '66666666-6666-4666-8666-666666666666',
  orphanQueue: '77777777-7777-4777-8777-777777777777',
  paymentsErrorRate: '88888888-8888-4888-8888-888888888888',
  gatewaySaturation: '99999999-9999-4999-8999-999999999999',
}

/** metricRef of the unresolved instance; no such metric exists */
const MISSING_METRIC = '00000000-dead-4000-8000-000000000000'

const MV = {
  ordersP99: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  paymentsP99: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  ordersErr: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  orphanDepth: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  paymentsErr: 'e1e1e1e1-e1e1-4e1e-8e1e-e1e1e1e1e1e1',
  gatewayState: 'f2f2f2f2-f2f2-4f2f-8f2f-f2f2f2f2f2f2',
}

const TH = {
  ordersP99Warn: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  ordersP99Crit: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
  ordersErrWarn: '12121212-1212-4212-8212-121212121212',
  paymentsErrWarn: '13131313-1313-4313-8313-131313131313',
  paymentsP99Floor: '14141414-1414-4414-8414-141414141414',
  gatewayDegraded: '15151515-1515-4515-8515-151515151515',
}

/** Node from mocks/nodes.ts — Sensor System A */
const ORDERS_NODE = 'b1c2d3e4-f5a6-4b7c-8d9e-1f2a3b4c5d6e'
/** Node from mocks/nodes.ts — Sensor System B */
const PAYMENTS_NODE = 'c2d3e4f5-a6b7-4c8d-9e1f-2a3b4c5d6e7f'
/** SystemInstance from mocks/systems.ts — Application (prod-eu) */
const APP_PROD_EU = 'e8b9c1d2-3f4a-4b5c-6d7e-8f9a1b2c3d4e'
/** ApiInstance from mocks/api.ts — Command API (prod-eu) */
const COMMAND_API_PROD_EU = 'ea1b2c3d-0000-4d5e-8f00-000000000001'

export const metrics = [
  {
    metricId: M.p99Latency,
    displayName: 'p99 API latency',
    description: 'End-to-end request latency at the 99th percentile.',
    annotations: [
      { key: 'emeland.io/unit', value: 'ms' },
      { key: 'emeland.io/dimension', value: 'latency' },
    ],
  },
  {
    metricId: M.errorRate,
    displayName: 'Error rate',
    description: 'Share of failed requests over a rolling window.',
    annotations: [
      { key: 'emeland.io/unit', value: 'ratio' },
      { key: 'emeland.io/dimension', value: 'reliability' },
    ],
  },
  {
    metricId: M.queueDepth,
    displayName: 'Queue depth',
    description: 'Pending messages in a work queue.',
    annotations: [
      { key: 'emeland.io/unit', value: 'messages' },
      { key: 'emeland.io/dimension', value: 'saturation' },
    ],
  },
] satisfies MetricWire[]

export const metricInstances = [
  {
    metricInstanceId: MI.ordersApiP99,
    displayName: 'p99 latency for orders-api',
    description: 'Measured at the orders-api ingress.',
    metricRef: { metricId: M.p99Latency },
    subject: { resourceId: ORDERS_NODE, resourceType: 'Node' },
    annotations: [
      {
        key: 'emeland.io/metric.expression',
        value:
          'histogram_quantile(0.99, rate(http_request_duration_seconds_bucket{svc="orders"}[5m]))',
      },
      { key: 'emeland.io/metric.language', value: 'promql' },
    ],
  },
  {
    metricInstanceId: MI.paymentsApiP99,
    displayName: 'p99 latency for payments-api',
    description: 'Measured at the payments-api ingress.',
    metricRef: { metricId: M.p99Latency },
    subject: { resourceId: PAYMENTS_NODE, resourceType: 'Node' },
    annotations: [
      {
        key: 'emeland.io/metric.expression',
        value:
          'histogram_quantile(0.99, rate(http_request_duration_seconds_bucket{svc="payments"}[5m]))',
      },
      { key: 'emeland.io/metric.language', value: 'promql' },
    ],
  },
  {
    metricInstanceId: MI.ordersErrorRate,
    displayName: 'Error rate for orders-api',
    metricRef: { metricId: M.errorRate },
    subject: { resourceId: ORDERS_NODE, resourceType: 'Node' },
    annotations: [
      {
        key: 'emeland.io/metric.expression',
        value:
          'sum(rate(http_requests_total{svc="orders",status=~"5.."}[5m])) / sum(rate(http_requests_total{svc="orders"}[5m]))',
      },
      { key: 'emeland.io/metric.language', value: 'promql' },
    ],
  },
  {
    metricInstanceId: MI.orphanQueue,
    displayName: 'Legacy batch queue depth',
    description: 'Orphan instance — metric vocabulary entry was removed.',
    // no metricRef ->unmapped
    annotations: [
      { key: 'emeland.io/metric.expression', value: 'legacy_batch_queue_depth' },
      { key: 'emeland.io/metric.language', value: 'text' },
    ],
  },
  {
    metricInstanceId: MI.paymentsErrorRate,
    displayName: 'Error rate for payments (prod-eu)',
    description: 'Reported in percent by the payments team dashboard.',
    metricRef: { metricId: M.errorRate },
    subject: { resourceId: APP_PROD_EU, resourceType: 'SystemInstance' },
    annotations: [
      // unit override: the vocabulary says ratio, this source reports percent
      { key: 'emeland.io/unit', value: '%' },
      {
        key: 'emeland.io/metric.expression',
        value:
          '100 * sum(rate(http_requests_total{app="payments",status=~"5.."}[5m])) / sum(rate(http_requests_total{app="payments"}[5m]))',
      },
      { key: 'emeland.io/metric.language', value: 'promql' },
    ],
  },
  {
    metricInstanceId: MI.gatewaySaturation,
    displayName: 'Gateway saturation',
    description: 'References a metric that was removed from the vocabulary.',
    metricRef: { metricId: MISSING_METRIC },
    subject: { resourceId: COMMAND_API_PROD_EU, resourceType: 'ApiInstance' },
    annotations: [
      { key: 'emeland.io/metric.expression', value: 'gateway_saturation_state' },
      { key: 'emeland.io/metric.language', value: 'text' },
    ],
  },
] satisfies MetricInstanceWire[]

export const metricValues = [
  {
    metricValueId: MV.ordersP99,
    displayName: 'Current p99 latency',
    metricInstanceRef: { metricInstanceId: MI.ordersApiP99 },
    value: '412',
    annotations: [],
  },
  {
    metricValueId: MV.paymentsP99,
    displayName: 'Current p99 latency',
    metricInstanceRef: { metricInstanceId: MI.paymentsApiP99 },
    value: '188',
    annotations: [],
  },
  {
    metricValueId: MV.ordersErr,
    displayName: 'Current error rate',
    metricInstanceRef: { metricInstanceId: MI.ordersErrorRate },
    value: '0.012',
    annotations: [],
  },
  {
    metricValueId: MV.orphanDepth,
    displayName: 'Current queue depth',
    metricInstanceRef: { metricInstanceId: MI.orphanQueue },
    value: '2401',
    annotations: [],
  },
  {
    metricValueId: MV.paymentsErr,
    displayName: 'Current error rate',
    metricInstanceRef: { metricInstanceId: MI.paymentsErrorRate },
    value: '1.2',
    annotations: [],
  },
  {
    metricValueId: MV.gatewayState,
    displayName: 'Current saturation state',
    description: 'Non-numeric reading reported by the gateway health check.',
    metricInstanceRef: { metricInstanceId: MI.gatewaySaturation },
    value: 'degraded',
    annotations: [],
  },
] satisfies MetricValueWire[]

export const thresholds = [
  {
    thresholdId: TH.ordersP99Warn,
    displayName: 'orders-api p99 warning',
    description: 'Warn when p99 exceeds 300ms.',
    metricInstanceRef: { metricInstanceId: MI.ordersApiP99 },
    annotations: [
      { key: 'emeland.io/threshold.operator', value: 'gt' },
      { key: 'emeland.io/threshold.limit', value: '300' },
      { key: 'emeland.io/threshold.language', value: 'text' },
    ],
  },
  {
    thresholdId: TH.ordersP99Crit,
    displayName: 'orders-api p99 critical',
    description: 'Critical when p99 exceeds 500ms.',
    metricInstanceRef: { metricInstanceId: MI.ordersApiP99 },
    annotations: [
      { key: 'emeland.io/threshold.expression', value: 'value > 500' },
      { key: 'emeland.io/threshold.language', value: 'cel' },
    ],
  },
  {
    thresholdId: TH.ordersErrWarn,
    displayName: 'orders-api error-rate warning',
    metricInstanceRef: { metricInstanceId: MI.ordersErrorRate },
    annotations: [
      { key: 'emeland.io/threshold.operator', value: 'gt' },
      { key: 'emeland.io/threshold.limit', value: '0.05' },
    ],
  },
  {
    thresholdId: TH.paymentsErrWarn,
    displayName: 'payments error-rate warning',
    description: 'Warn above 5 percent.',
    metricInstanceRef: { metricInstanceId: MI.paymentsErrorRate },
    annotations: [
      { key: 'emeland.io/threshold.operator', value: 'gt' },
      { key: 'emeland.io/threshold.limit', value: '5' },
    ],
  },
  {
    thresholdId: TH.paymentsP99Floor,
    displayName: 'payments-api p99 sanity floor',
    description: 'A p99 below 50ms indicates the probe is not measuring real traffic.',
    metricInstanceRef: { metricInstanceId: MI.paymentsApiP99 },
    annotations: [
      { key: 'emeland.io/threshold.operator', value: 'lt' },
      { key: 'emeland.io/threshold.limit', value: '50' },
    ],
  },
  {
    thresholdId: TH.gatewayDegraded,
    displayName: 'gateway degraded',
    metricInstanceRef: { metricInstanceId: MI.gatewaySaturation },
    annotations: [
      { key: 'emeland.io/threshold.expression', value: 'value == "degraded"' },
      { key: 'emeland.io/threshold.language', value: 'cel' },
    ],
  },
] satisfies ThresholdWire[]
