/**
 * Observability mockups (Phase 6)
 *
 * Subjects reference resources from other mock files:
 *   Nodes (nodes.ts):            Sensor System A  b1c2d3e4-f5a6-4b7c-8d9e-1f2a3b4c5d6e
 *                                Sensor System B  c2d3e4f5-a6b7-4c8d-9e1f-2a3b4c5d6e7f
 *   SystemInstance (systems.ts): Application (ber-prod)  e8b9c1d2-3f4a-4b5c-6d7e-8f9a1b2c3d4e
 *   ApiInstance (api.ts):        Command API (ber-prod)  ea1b2c3d-0000-4d5e-8f00-000000000001
 *   API (api.ts):                Event Bus              ac3d4e5f-6a7b-4c8d-1e2f-3a4b5c6d7e8f
 *                                Public Gateway         ad4e5f6a-7b8c-4d9e-1f2a-3b4c5d6e7f8a
 *   ComponentInstance (components.ts):
 *                                App Backend (ber-prod)  d3a1b2c3-0000-4d5e-8f00-000000000003
 *                                Kong Gateway (ber-prod) d5a1b2c3-0000-4d5e-8f00-000000000005
 *                                Grafana Server (prod)  d7a1b2c3-0000-4d5e-8f00-000000000007
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
  cpuUtilization: '44444444-1111-4111-8111-111111111111',
  consumerLag: '55555555-1111-4111-8111-111111111111',
  certValidity: '66666666-1111-4111-8111-111111111111',
}

const MI = {
  ordersApiP99: '44444444-4444-4444-8444-444444444444',
  paymentsApiP99: '55555555-5555-4555-8555-555555555555',
  ordersErrorRate: '66666666-6666-4666-8666-666666666666',
  orphanQueue: '77777777-7777-4777-8777-777777777777',
  paymentsErrorRate: '88888888-8888-4888-8888-888888888888',
  gatewaySaturation: '99999999-9999-4999-8999-999999999999',
  orderEventsBacklog: 'a1a1a1a1-0001-4000-8000-000000000001',
  emailBacklog: 'a1a1a1a1-0002-4000-8000-000000000002',
  backendCpu: 'a1a1a1a1-0003-4000-8000-000000000003',
  kongCpu: 'a1a1a1a1-0004-4000-8000-000000000004',
  grafanaCpu: 'a1a1a1a1-0005-4000-8000-000000000005',
  billingLag: 'a1a1a1a1-0006-4000-8000-000000000006',
  gatewayCert: 'a1a1a1a1-0007-4000-8000-000000000007',
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
  orderEventsBacklog: 'b2b2b2b2-0001-4000-8000-000000000001',
  backendCpu1m: 'b2b2b2b2-0002-4000-8000-000000000002',
  backendCpu15m: 'b2b2b2b2-0003-4000-8000-000000000003',
  kongCpu: 'b2b2b2b2-0004-4000-8000-000000000004',
  grafanaCpu: 'b2b2b2b2-0005-4000-8000-000000000005',
  billingLag: 'b2b2b2b2-0006-4000-8000-000000000006',
  gatewayCertDays: 'b2b2b2b2-0007-4000-8000-000000000007',
}

const TH = {
  ordersP99Warn: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  ordersP99Crit: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
  ordersErrWarn: '12121212-1212-4212-8212-121212121212',
  paymentsErrWarn: '13131313-1313-4313-8313-131313131313',
  paymentsP99Floor: '14141414-1414-4414-8414-141414141414',
  gatewayDegraded: '15151515-1515-4515-8515-151515151515',
  orderEventsWarn: 'c3c3c3c3-0001-4000-8000-000000000001',
  orderEventsCrit: 'c3c3c3c3-0002-4000-8000-000000000002',
  emailBacklogWarn: 'c3c3c3c3-0003-4000-8000-000000000003',
  backendCpuWarn: 'c3c3c3c3-0004-4000-8000-000000000004',
  backendCpuCrit: 'c3c3c3c3-0005-4000-8000-000000000005',
  kongCpuWarn: 'c3c3c3c3-0006-4000-8000-000000000006',
  billingLagWarn: 'c3c3c3c3-0007-4000-8000-000000000007',
  gatewayCertWarn: 'c3c3c3c3-0008-4000-8000-000000000008',
  gatewayCertCrit: 'c3c3c3c3-0009-4000-8000-000000000009',
}

/** Node from mocks/nodes.ts — Sensor System A */
const ORDERS_NODE = 'b1c2d3e4-f5a6-4b7c-8d9e-1f2a3b4c5d6e'
/** Node from mocks/nodes.ts — Sensor System B */
const PAYMENTS_NODE = 'c2d3e4f5-a6b7-4c8d-9e1f-2a3b4c5d6e7f'
/** SystemInstance from mocks/systems.ts — Application (ber-prod) */
const APP_PROD_EU = 'e8b9c1d2-3f4a-4b5c-6d7e-8f9a1b2c3d4e'
/** ApiInstance from mocks/api.ts — Command API (ber-prod) */
const COMMAND_API_PROD_EU = 'ea1b2c3d-0000-4d5e-8f00-000000000001'
/** API from mocks/api.ts — Event Bus */
const EVENT_BUS_API = 'ac3d4e5f-6a7b-4c8d-1e2f-3a4b5c6d7e8f'
/** API from mocks/api.ts — Public Gateway */
const PUBLIC_GATEWAY_API = 'ad4e5f6a-7b8c-4d9e-1f2a-3b4c5d6e7f8a'
/** ComponentInstance from mocks/components.ts — App Backend (ber-prod) */
const APP_BACKEND_PROD_EU = 'd3a1b2c3-0000-4d5e-8f00-000000000003'
/** ComponentInstance from mocks/components.ts — Kong Gateway (ber-prod) */
const KONG_PROD_EU = 'd5a1b2c3-0000-4d5e-8f00-000000000005'
/** ComponentInstance from mocks/components.ts — Grafana Server (prod) */
const GRAFANA_PROD = 'd7a1b2c3-0000-4d5e-8f00-000000000007'

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
  {
    metricId: M.cpuUtilization,
    displayName: 'CPU utilization',
    description: 'Share of available CPU time in use, averaged over the sampling window.',
    annotations: [
      { key: 'emeland.io/unit', value: '%' },
      { key: 'emeland.io/dimension', value: 'saturation' },
    ],
  },
  {
    metricId: M.consumerLag,
    displayName: 'Consumer lag',
    description: 'Messages published but not yet processed by a subscribing consumer.',
    annotations: [
      { key: 'emeland.io/unit', value: 'messages' },
      { key: 'emeland.io/dimension', value: 'throughput' },
    ],
  },
  {
    metricId: M.certValidity,
    displayName: 'TLS certificate validity',
    description: 'Days until the serving certificate expires. No dimension assigned yet.',
    annotations: [{ key: 'emeland.io/unit', value: 'days' }],
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
    displayName: 'Error rate for payments (ber-prod)',
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
  {
    metricInstanceId: MI.orderEventsBacklog,
    displayName: 'Order events backlog',
    description: 'Unprocessed order events on the Event Bus.',
    metricRef: { metricId: M.queueDepth },
    subject: { resourceId: EVENT_BUS_API, resourceType: 'API' },
    annotations: [
      { key: 'emeland.io/metric.expression', value: 'sum(kafka_topic_backlog{topic="orders"})' },
      { key: 'emeland.io/metric.language', value: 'promql' },
    ],
  },
  {
    metricInstanceId: MI.emailBacklog,
    displayName: 'Email dispatch backlog',
    description: 'Queued notification emails. The exporter has not reported a value yet.',
    metricRef: { metricId: M.queueDepth },
    subject: { resourceId: APP_BACKEND_PROD_EU, resourceType: 'ComponentInstance' },
    // no value -> no reading
    annotations: [],
  },
  {
    metricInstanceId: MI.backendCpu,
    displayName: 'CPU utilization for App Backend (ber-prod)',
    description: 'Two readings: a 1 minute and a 15 minute average.',
    metricRef: { metricId: M.cpuUtilization },
    subject: { resourceId: APP_BACKEND_PROD_EU, resourceType: 'ComponentInstance' },
    annotations: [
      {
        key: 'emeland.io/metric.expression',
        value: '100 * (1 - avg(rate(node_cpu_seconds_total{mode="idle",app="backend"}[1m])))',
      },
      { key: 'emeland.io/metric.language', value: 'promql' },
    ],
  },
  {
    metricInstanceId: MI.kongCpu,
    displayName: 'CPU utilization for Kong Gateway (ber-prod)',
    metricRef: { metricId: M.cpuUtilization },
    subject: { resourceId: KONG_PROD_EU, resourceType: 'ComponentInstance' },
    annotations: [],
  },
  {
    metricInstanceId: MI.grafanaCpu,
    displayName: 'CPU utilization for Grafana Server (prod)',
    description: 'Collected for capacity planning only; no threshold defined.',
    metricRef: { metricId: M.cpuUtilization },
    subject: { resourceId: GRAFANA_PROD, resourceType: 'ComponentInstance' },
    // no thresholds -> unevaluated
    annotations: [],
  },
  {
    metricInstanceId: MI.billingLag,
    displayName: 'Consumer lag of the billing consumer',
    description: 'Lag of the billing service on the Event Bus order topic.',
    metricRef: { metricId: M.consumerLag },
    subject: { resourceId: EVENT_BUS_API, resourceType: 'API' },
    annotations: [
      {
        key: 'emeland.io/metric.expression',
        value: 'sum(kafka_consumergroup_lag{group="billing",topic="orders"})',
      },
      { key: 'emeland.io/metric.language', value: 'promql' },
    ],
  },
  {
    metricInstanceId: MI.gatewayCert,
    displayName: 'Certificate validity of the Public Gateway',
    metricRef: { metricId: M.certValidity },
    subject: { resourceId: PUBLIC_GATEWAY_API, resourceType: 'API' },
    annotations: [
      {
        key: 'emeland.io/metric.expression',
        value: '(probe_ssl_earliest_cert_expiry - time()) / 86400',
      },
      { key: 'emeland.io/metric.language', value: 'promql' },
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
  {
    metricValueId: MV.orderEventsBacklog,
    displayName: 'Current backlog',
    metricInstanceRef: { metricInstanceId: MI.orderEventsBacklog },
    value: '143',
    annotations: [],
  },
  {
    metricValueId: MV.backendCpu1m,
    displayName: '1 minute average',
    metricInstanceRef: { metricInstanceId: MI.backendCpu },
    value: '91',
    annotations: [],
  },
  {
    metricValueId: MV.backendCpu15m,
    displayName: '15 minute average',
    metricInstanceRef: { metricInstanceId: MI.backendCpu },
    value: '78',
    annotations: [],
  },
  {
    metricValueId: MV.kongCpu,
    displayName: '1 minute average',
    metricInstanceRef: { metricInstanceId: MI.kongCpu },
    value: '34',
    annotations: [],
  },
  {
    metricValueId: MV.grafanaCpu,
    displayName: '1 minute average',
    metricInstanceRef: { metricInstanceId: MI.grafanaCpu },
    value: '12',
    annotations: [],
  },
  {
    metricValueId: MV.billingLag,
    displayName: 'Current lag',
    metricInstanceRef: { metricInstanceId: MI.billingLag },
    value: '18234',
    annotations: [],
  },
  {
    metricValueId: MV.gatewayCertDays,
    displayName: 'Days until expiry',
    metricInstanceRef: { metricInstanceId: MI.gatewayCert },
    value: '12',
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
  {
    thresholdId: TH.orderEventsWarn,
    displayName: 'order backlog warning',
    metricInstanceRef: { metricInstanceId: MI.orderEventsBacklog },
    annotations: [
      { key: 'emeland.io/threshold.operator', value: 'ge' },
      { key: 'emeland.io/threshold.limit', value: '1000' },
    ],
  },
  {
    thresholdId: TH.orderEventsCrit,
    displayName: 'order backlog critical',
    metricInstanceRef: { metricInstanceId: MI.orderEventsBacklog },
    annotations: [
      { key: 'emeland.io/threshold.operator', value: 'ge' },
      { key: 'emeland.io/threshold.limit', value: '5000' },
    ],
  },
  {
    thresholdId: TH.emailBacklogWarn,
    displayName: 'email backlog warning',
    metricInstanceRef: { metricInstanceId: MI.emailBacklog },
    annotations: [
      { key: 'emeland.io/threshold.operator', value: 'gt' },
      { key: 'emeland.io/threshold.limit', value: '500' },
    ],
  },
  {
    thresholdId: TH.backendCpuWarn,
    displayName: 'backend CPU warning',
    description: 'Warn at 85 percent sustained load.',
    metricInstanceRef: { metricInstanceId: MI.backendCpu },
    annotations: [
      { key: 'emeland.io/threshold.operator', value: 'ge' },
      { key: 'emeland.io/threshold.limit', value: '85' },
    ],
  },
  {
    thresholdId: TH.backendCpuCrit,
    displayName: 'backend CPU critical',
    metricInstanceRef: { metricInstanceId: MI.backendCpu },
    annotations: [
      { key: 'emeland.io/threshold.operator', value: 'ge' },
      { key: 'emeland.io/threshold.limit', value: '95' },
    ],
  },
  {
    thresholdId: TH.kongCpuWarn,
    displayName: 'gateway CPU warning',
    metricInstanceRef: { metricInstanceId: MI.kongCpu },
    annotations: [
      { key: 'emeland.io/threshold.operator', value: 'ge' },
      { key: 'emeland.io/threshold.limit', value: '85' },
    ],
  },
  {
    thresholdId: TH.billingLagWarn,
    displayName: 'billing lag warning',
    description: 'The billing SLO allows at most 10k unprocessed order events.',
    metricInstanceRef: { metricInstanceId: MI.billingLag },
    annotations: [
      { key: 'emeland.io/threshold.operator', value: 'gt' },
      { key: 'emeland.io/threshold.limit', value: '10000' },
    ],
  },
  {
    thresholdId: TH.gatewayCertWarn,
    displayName: 'certificate renewal due',
    description: 'Renew certificates at least 30 days before expiry.',
    metricInstanceRef: { metricInstanceId: MI.gatewayCert },
    annotations: [
      { key: 'emeland.io/threshold.operator', value: 'lt' },
      { key: 'emeland.io/threshold.limit', value: '30' },
    ],
  },
  {
    thresholdId: TH.gatewayCertCrit,
    displayName: 'certificate expiry imminent',
    metricInstanceRef: { metricInstanceId: MI.gatewayCert },
    annotations: [
      { key: 'emeland.io/threshold.operator', value: 'le' },
      { key: 'emeland.io/threshold.limit', value: '7' },
    ],
  },
] satisfies ThresholdWire[]
