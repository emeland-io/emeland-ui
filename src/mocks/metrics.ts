/**
 * Observability mockups (Phase 6)
 *
 * Metrics follow the four golden signals (latency, traffic, errors, saturation)
 * for the landscape in the other mocks: the Helm-deployed Application with its
 * Command/Query APIs and Kafka Event Bus, the Kong gateway and the
 * kube-prometheus-stack, all on cluster ber-prod (namespaces app, kong,
 * monitoring). Expressions are PromQL against kube-state-metrics, cAdvisor,
 * kubelet, the Kafka exporter, Kong and blackbox exporters.
 *
 * Subjects reference resources from other mock files:
 *   Nodes (nodes.ts):            Sensor System A           b1c2d3e4-f5a6-4b7c-8d9e-1f2a3b4c5d6e
 *                                Sensor System B           c2d3e4f5-a6b7-4c8d-9e1f-2a3b4c5d6e7f
 *   SystemInstance (systems.ts): Application (ber-prod)     e8b9c1d2-3f4a-4b5c-6d7e-8f9a1b2c3d4e
 *   API (api.ts):                Event Bus                 ac3d4e5f-6a7b-4c8d-1e2f-3a4b5c6d7e8f
 *                                Public Gateway            ad4e5f6a-7b8c-4d9e-1f2a-3b4c5d6e7f8a
 *   ApiInstance (api.ts):        Command API (ber-prod)     ea1b2c3d-0000-4d5e-8f00-000000000001
 *                                Query API (ber-prod)       eb1b2c3d-0000-4d5e-8f00-000000000001
 *                                Public Gateway (ber-prod)  ed1b2c3d-0000-4d5e-8f00-000000000001
 *   ComponentInstance (components.ts):
 *                                App Backend (ber-prod)     d3a1b2c3-0000-4d5e-8f00-000000000003
 *                                App Backend (staging)     d4a1b2c3-0000-4d5e-8f00-000000000004
 *                                Kong Gateway (ber-prod)    d5a1b2c3-0000-4d5e-8f00-000000000005
 *                                Grafana Server (prod)     d7a1b2c3-0000-4d5e-8f00-000000000007
 *                                Prometheus Server (prod)  d9a1b2c3-0000-4d5e-8f00-000000000009
 *
 * Findings referencing these instances live in findings.ts (ThresholdBreached
 * for the backend CPU, the gateway 5xx rate, the Kong restarts, the
 * deployment dead-letter queue and the deploy-notifier lag; MetricNotFound for
 * the gateway saturation instance).
 *
 * Deliberate edge cases: an instance without a metric reference and one whose
 * metric was removed (both unmapped), an instance without a value (no
 * reading), instances without thresholds (unevaluated), a non-numeric value
 * with a CEL threshold, a unit override on an instance, two readings on one
 * instance, lower-bound (lt/le) thresholds, and a metric without a dimension.
 */
import type {
  Metric as MetricWire,
  MetricInstance as MetricInstanceWire,
  MetricValue as MetricValueWire,
  Threshold as ThresholdWire,
} from '@/api/gen/types.gen'

const M = {
  requestLatency: '11111111-0000-4000-8000-000000000001',
  eventDeliveryLatency: '11111111-0000-4000-8000-000000000002',
  requestRate: '11111111-0000-4000-8000-000000000003',
  eventThroughput: '11111111-0000-4000-8000-000000000004',
  errorRate: '11111111-0000-4000-8000-000000000005',
  deadLetterEvents: '11111111-0000-4000-8000-000000000006',
  podRestarts: '11111111-0000-4000-8000-000000000007',
  cpuUtilization: '11111111-0000-4000-8000-000000000008',
  memoryUtilization: '11111111-0000-4000-8000-000000000009',
  consumerLag: '11111111-0000-4000-8000-000000000010',
  pendingJobs: '11111111-0000-4000-8000-000000000011',
  volumeUsage: '11111111-0000-4000-8000-000000000012',
  certValidity: '11111111-0000-4000-8000-000000000013',
}

const MI = {
  sensorALatency: 'a1a1a1a1-0001-4000-8000-000000000001',
  sensorBLatency: 'a1a1a1a1-0002-4000-8000-000000000002',
  backendCpu: 'a1a1a1a1-0003-4000-8000-000000000003',
  commandApiLatency: 'a1a1a1a1-0004-4000-8000-000000000004',
  queryApiLatency: 'a1a1a1a1-0005-4000-8000-000000000005',
  notifierLag: 'a1a1a1a1-0006-4000-8000-000000000006',
  gatewayLatency: 'a1a1a1a1-0007-4000-8000-000000000007',
  commandApiRate: 'a1a1a1a1-0008-4000-8000-000000000008',
  queryApiRate: 'a1a1a1a1-0009-4000-8000-000000000009',
  gatewayRate: 'a1a1a1a1-0010-4000-8000-000000000010',
  buildTopicThroughput: 'a1a1a1a1-0011-4000-8000-000000000011',
  deploymentTopicThroughput: 'a1a1a1a1-0012-4000-8000-000000000012',
  commandApiErrors: 'a1a1a1a1-0013-4000-8000-000000000013',
  appErrorsPercent: 'a1a1a1a1-0014-4000-8000-000000000014',
  gatewayErrors: 'a1a1a1a1-0015-4000-8000-000000000015',
  deploymentDlq: 'a1a1a1a1-0016-4000-8000-000000000016',
  buildDlq: 'a1a1a1a1-0017-4000-8000-000000000017',
  kongRestarts: 'a1a1a1a1-0018-4000-8000-000000000018',
  backendRestarts: 'a1a1a1a1-0019-4000-8000-000000000019',
  kongCpu: 'a1a1a1a1-0020-4000-8000-000000000020',
  grafanaCpu: 'a1a1a1a1-0021-4000-8000-000000000021',
  prometheusMemory: 'a1a1a1a1-0022-4000-8000-000000000022',
  backendMemory: 'a1a1a1a1-0023-4000-8000-000000000023',
  indexerLag: 'a1a1a1a1-0024-4000-8000-000000000024',
  backendPendingJobs: 'a1a1a1a1-0025-4000-8000-000000000025',
  stagingPendingJobs: 'a1a1a1a1-0026-4000-8000-000000000026',
  prometheusVolume: 'a1a1a1a1-0027-4000-8000-000000000027',
  gatewayCert: 'a1a1a1a1-0028-4000-8000-000000000028',
  orphanQueue: '77777777-7777-4777-8777-777777777777',
  gatewaySaturation: '99999999-9999-4999-8999-999999999999',
}

/** metricRef of the unresolved instance; no such metric exists */
const MISSING_METRIC = '00000000-dead-4000-8000-000000000000'

const mv = (n: number) =>
  `b2b2b2b2-${String(n).padStart(4, '0')}-4000-8000-${String(n).padStart(12, '0')}`
const th = (n: number) =>
  `c3c3c3c3-${String(n).padStart(4, '0')}-4000-8000-${String(n).padStart(12, '0')}`

/** Node from mocks/nodes.ts — Sensor System A (scan mode) */
const SENSOR_A = 'b1c2d3e4-f5a6-4b7c-8d9e-1f2a3b4c5d6e'
/** Node from mocks/nodes.ts — Sensor System B (subscribes to Kafka) */
const SENSOR_B = 'c2d3e4f5-a6b7-4c8d-9e1f-2a3b4c5d6e7f'
/** SystemInstance from mocks/systems.ts — Application (ber-prod) */
const APP_PROD_EU = 'e8b9c1d2-3f4a-4b5c-6d7e-8f9a1b2c3d4e'
/** API from mocks/api.ts — Event Bus */
const EVENT_BUS_API = 'ac3d4e5f-6a7b-4c8d-1e2f-3a4b5c6d7e8f'
/** API from mocks/api.ts — Public Gateway */
const PUBLIC_GATEWAY_API = 'ad4e5f6a-7b8c-4d9e-1f2a-3b4c5d6e7f8a'
/** ApiInstance from mocks/api.ts — Command API (ber-prod) */
const COMMAND_API_PROD_EU = 'ea1b2c3d-0000-4d5e-8f00-000000000001'
/** ApiInstance from mocks/api.ts — Query API (ber-prod) */
const QUERY_API_PROD_EU = 'eb1b2c3d-0000-4d5e-8f00-000000000001'
/** ApiInstance from mocks/api.ts — Public Gateway (ber-prod) */
const GATEWAY_PROD_EU = 'ed1b2c3d-0000-4d5e-8f00-000000000001'
/** ComponentInstance from mocks/components.ts — App Backend (ber-prod) */
const APP_BACKEND_PROD_EU = 'd3a1b2c3-0000-4d5e-8f00-000000000003'
/** ComponentInstance from mocks/components.ts — App Backend (staging) */
const APP_BACKEND_STAGING = 'd4a1b2c3-0000-4d5e-8f00-000000000004'
/** ComponentInstance from mocks/components.ts — Kong Gateway (ber-prod) */
const KONG_PROD_EU = 'd5a1b2c3-0000-4d5e-8f00-000000000005'
/** ComponentInstance from mocks/components.ts — Grafana Server (prod) */
const GRAFANA_PROD = 'd7a1b2c3-0000-4d5e-8f00-000000000007'
/** ComponentInstance from mocks/components.ts — Prometheus Server (prod) */
const PROMETHEUS_PROD = 'd9a1b2c3-0000-4d5e-8f00-000000000009'

const promql = (expression: string) => [
  { key: 'emeland.io/metric.expression', value: expression },
  { key: 'emeland.io/metric.language', value: 'promql' },
]

const COMMAND_ROUTES = 'route=~"/api/v1/commands.*"'
const QUERY_ROUTES = 'route=~"/api/v1/(pipelines|builds|artifacts).*"'
const BACKEND_HTTP = 'http_server_requests_total{namespace="app",container="app-backend"'
const GATEWAY_HTTP = 'kong_http_requests_total{namespace="kong",service="public-gateway"'

export const metrics = [
  // latency
  {
    metricId: M.requestLatency,
    displayName: 'p99 request latency',
    description: 'Server-side request duration at the 99th percentile over a 5 minute window.',
    annotations: [
      { key: 'emeland.io/unit', value: 'ms' },
      { key: 'emeland.io/dimension', value: 'latency' },
    ],
  },
  {
    metricId: M.eventDeliveryLatency,
    displayName: 'Event delivery latency',
    description:
      'Time from a sensor observing a change in its source system until the event is acknowledged by the Event Bus, 95th percentile.',
    annotations: [
      { key: 'emeland.io/unit', value: 'ms' },
      { key: 'emeland.io/dimension', value: 'latency' },
    ],
  },
  // traffic
  {
    metricId: M.requestRate,
    displayName: 'Request rate',
    description: 'HTTP requests per second, averaged over a 5 minute window.',
    annotations: [
      { key: 'emeland.io/unit', value: 'req/s' },
      { key: 'emeland.io/dimension', value: 'traffic' },
    ],
  },
  {
    metricId: M.eventThroughput,
    displayName: 'Event throughput',
    description:
      'Events produced to an Event Bus topic per second, averaged over a 5 minute window.',
    annotations: [
      { key: 'emeland.io/unit', value: 'events/s' },
      { key: 'emeland.io/dimension', value: 'traffic' },
    ],
  },
  // errors
  {
    metricId: M.errorRate,
    displayName: 'Error rate',
    description: 'Share of requests answered with a 5xx status over a 5 minute window.',
    annotations: [
      { key: 'emeland.io/unit', value: 'ratio' },
      { key: 'emeland.io/dimension', value: 'errors' },
    ],
  },
  {
    metricId: M.deadLetterEvents,
    displayName: 'Dead-letter events',
    description:
      'Events parked on a dead-letter topic after their consumer gave up. Any value above zero needs attention.',
    annotations: [
      { key: 'emeland.io/unit', value: 'events' },
      { key: 'emeland.io/dimension', value: 'errors' },
    ],
  },
  {
    metricId: M.podRestarts,
    displayName: 'Container restarts',
    description: 'Container restarts across all pods of a workload within the last hour.',
    annotations: [
      { key: 'emeland.io/unit', value: 'restarts' },
      { key: 'emeland.io/dimension', value: 'errors' },
    ],
  },
  // saturation
  {
    metricId: M.cpuUtilization,
    displayName: 'CPU utilization',
    description: 'CPU usage of a workload as a share of its Kubernetes CPU limit.',
    annotations: [
      { key: 'emeland.io/unit', value: '%' },
      { key: 'emeland.io/dimension', value: 'saturation' },
    ],
  },
  {
    metricId: M.memoryUtilization,
    displayName: 'Memory utilization',
    description: 'Container working set as a share of the Kubernetes memory limit.',
    annotations: [
      { key: 'emeland.io/unit', value: '%' },
      { key: 'emeland.io/dimension', value: 'saturation' },
    ],
  },
  {
    metricId: M.consumerLag,
    displayName: 'Consumer lag',
    description: 'Events published to a topic but not yet processed by a consumer group.',
    annotations: [
      { key: 'emeland.io/unit', value: 'events' },
      { key: 'emeland.io/dimension', value: 'saturation' },
    ],
  },
  {
    metricId: M.pendingJobs,
    displayName: 'Pending pipeline jobs',
    description: 'Pipeline jobs accepted by the Command API that are still waiting for a runner.',
    annotations: [
      { key: 'emeland.io/unit', value: 'jobs' },
      { key: 'emeland.io/dimension', value: 'saturation' },
    ],
  },
  {
    metricId: M.volumeUsage,
    displayName: 'Persistent volume usage',
    description: 'Used share of a persistent volume claim as reported by the kubelet.',
    annotations: [
      { key: 'emeland.io/unit', value: '%' },
      { key: 'emeland.io/dimension', value: 'saturation' },
    ],
  },
  // no dimension assigned
  {
    metricId: M.certValidity,
    displayName: 'TLS certificate validity',
    description: 'Days until the serving certificate expires. No dimension assigned yet.',
    annotations: [{ key: 'emeland.io/unit', value: 'days' }],
  },
] satisfies MetricWire[]

export const metricInstances = [
  // --- latency
  {
    metricInstanceId: MI.sensorALatency,
    displayName: 'Event delivery latency of Sensor System A',
    description: 'Sensor System A scans its source every 30 seconds, so delivery takes longer.',
    metricRef: { metricId: M.eventDeliveryLatency },
    subject: { resourceId: SENSOR_A, resourceType: 'Node' },
    annotations: promql(
      'histogram_quantile(0.95, sum by (le) (rate(eximpl_sensor_event_delivery_seconds_bucket{cluster="ber-prod",sensor="sensor-system-a"}[5m]))) * 1000',
    ),
  },
  {
    metricInstanceId: MI.sensorBLatency,
    displayName: 'Event delivery latency of Sensor System B',
    metricRef: { metricId: M.eventDeliveryLatency },
    subject: { resourceId: SENSOR_B, resourceType: 'Node' },
    annotations: promql(
      'histogram_quantile(0.95, sum by (le) (rate(eximpl_sensor_event_delivery_seconds_bucket{cluster="ber-prod",sensor="sensor-system-b"}[5m]))) * 1000',
    ),
  },
  {
    metricInstanceId: MI.commandApiLatency,
    displayName: 'p99 latency of Command API (ber-prod)',
    description: 'Measured in the app-backend pods, excludes the gateway hop.',
    metricRef: { metricId: M.requestLatency },
    subject: { resourceId: COMMAND_API_PROD_EU, resourceType: 'ApiInstance' },
    annotations: promql(
      `histogram_quantile(0.99, sum by (le) (rate(http_server_request_duration_seconds_bucket{namespace="app",container="app-backend",${COMMAND_ROUTES}}[5m]))) * 1000`,
    ),
  },
  {
    metricInstanceId: MI.queryApiLatency,
    displayName: 'p99 latency of Query API (ber-prod)',
    metricRef: { metricId: M.requestLatency },
    subject: { resourceId: QUERY_API_PROD_EU, resourceType: 'ApiInstance' },
    annotations: promql(
      `histogram_quantile(0.99, sum by (le) (rate(http_server_request_duration_seconds_bucket{namespace="app",container="app-backend",${QUERY_ROUTES}}[5m]))) * 1000`,
    ),
  },
  {
    metricInstanceId: MI.gatewayLatency,
    displayName: 'p99 latency of Public Gateway (ber-prod)',
    description: 'End-to-end as seen by Kong, including the upstream call.',
    metricRef: { metricId: M.requestLatency },
    subject: { resourceId: GATEWAY_PROD_EU, resourceType: 'ApiInstance' },
    annotations: promql(
      'histogram_quantile(0.99, sum by (le) (rate(kong_request_latency_ms_bucket{namespace="kong",service="public-gateway"}[5m])))',
    ),
  },
  // --- traffic
  {
    metricInstanceId: MI.commandApiRate,
    displayName: 'Request rate of Command API (ber-prod)',
    description: 'Collected for capacity planning only; no threshold defined.',
    metricRef: { metricId: M.requestRate },
    subject: { resourceId: COMMAND_API_PROD_EU, resourceType: 'ApiInstance' },
    // no thresholds -> unevaluated
    annotations: promql(`sum(rate(${BACKEND_HTTP},${COMMAND_ROUTES}}[5m]))`),
  },
  {
    metricInstanceId: MI.queryApiRate,
    displayName: 'Request rate of Query API (ber-prod)',
    metricRef: { metricId: M.requestRate },
    subject: { resourceId: QUERY_API_PROD_EU, resourceType: 'ApiInstance' },
    annotations: promql(`sum(rate(${BACKEND_HTTP},${QUERY_ROUTES}}[5m]))`),
  },
  {
    metricInstanceId: MI.gatewayRate,
    displayName: 'Request rate of Public Gateway (ber-prod)',
    description:
      'All routes behind the public gateway. The rate limit plugin is set to 5000 req/s.',
    metricRef: { metricId: M.requestRate },
    subject: { resourceId: GATEWAY_PROD_EU, resourceType: 'ApiInstance' },
    annotations: promql(`sum(rate(${GATEWAY_HTTP}}[5m]))`),
  },
  {
    metricInstanceId: MI.buildTopicThroughput,
    displayName: 'Throughput of topic build.lifecycle',
    description: 'Build started, finished and failed events produced by the app-backend pods.',
    metricRef: { metricId: M.eventThroughput },
    subject: { resourceId: EVENT_BUS_API, resourceType: 'API' },
    annotations: promql(
      'sum(rate(kafka_server_brokertopicmetrics_messagesin_total{namespace="app",topic="build.lifecycle"}[5m]))',
    ),
  },
  {
    metricInstanceId: MI.deploymentTopicThroughput,
    displayName: 'Throughput of topic deployment.lifecycle',
    metricRef: { metricId: M.eventThroughput },
    subject: { resourceId: EVENT_BUS_API, resourceType: 'API' },
    // no thresholds -> unevaluated
    annotations: promql(
      'sum(rate(kafka_server_brokertopicmetrics_messagesin_total{namespace="app",topic="deployment.lifecycle"}[5m]))',
    ),
  },
  // --- errors
  {
    metricInstanceId: MI.commandApiErrors,
    displayName: 'Error rate of Command API (ber-prod)',
    metricRef: { metricId: M.errorRate },
    subject: { resourceId: COMMAND_API_PROD_EU, resourceType: 'ApiInstance' },
    annotations: promql(
      `sum(rate(${BACKEND_HTTP},${COMMAND_ROUTES},status=~"5.."}[5m])) / sum(rate(${BACKEND_HTTP},${COMMAND_ROUTES}}[5m]))`,
    ),
  },
  {
    metricInstanceId: MI.appErrorsPercent,
    displayName: 'Error rate of Application (ber-prod)',
    description:
      'All backend routes combined, reported in percent by the platform team Grafana dashboard.',
    metricRef: { metricId: M.errorRate },
    subject: { resourceId: APP_PROD_EU, resourceType: 'SystemInstance' },
    annotations: [
      // unit override: the vocabulary says ratio, this source reports percent
      { key: 'emeland.io/unit', value: '%' },
      ...promql(
        `100 * sum(rate(${BACKEND_HTTP},status=~"5.."}[5m])) / sum(rate(${BACKEND_HTTP}}[5m]))`,
      ),
    ],
  },
  {
    metricInstanceId: MI.gatewayErrors,
    displayName: 'Error rate of Public Gateway (ber-prod)',
    description: '5xx answered by Kong itself or passed through from the upstream.',
    metricRef: { metricId: M.errorRate },
    subject: { resourceId: GATEWAY_PROD_EU, resourceType: 'ApiInstance' },
    annotations: promql(
      `sum(rate(${GATEWAY_HTTP},code=~"5.."}[5m])) / sum(rate(${GATEWAY_HTTP}}[5m]))`,
    ),
  },
  {
    metricInstanceId: MI.deploymentDlq,
    displayName: 'Dead-letter events of topic deployment.lifecycle',
    description: 'Events the deploy-notifier consumer failed to process after three retries.',
    metricRef: { metricId: M.deadLetterEvents },
    subject: { resourceId: EVENT_BUS_API, resourceType: 'API' },
    annotations: promql(
      'sum(kafka_topic_partition_current_offset{namespace="app",topic="deployment.lifecycle.dlq"} - kafka_topic_partition_oldest_offset{namespace="app",topic="deployment.lifecycle.dlq"})',
    ),
  },
  {
    metricInstanceId: MI.buildDlq,
    displayName: 'Dead-letter events of topic build.lifecycle',
    metricRef: { metricId: M.deadLetterEvents },
    subject: { resourceId: EVENT_BUS_API, resourceType: 'API' },
    annotations: promql(
      'sum(kafka_topic_partition_current_offset{namespace="app",topic="build.lifecycle.dlq"} - kafka_topic_partition_oldest_offset{namespace="app",topic="build.lifecycle.dlq"})',
    ),
  },
  {
    metricInstanceId: MI.kongRestarts,
    displayName: 'Container restarts of Kong Gateway (ber-prod)',
    description: 'The kong container in the kong namespace, all replicas.',
    metricRef: { metricId: M.podRestarts },
    subject: { resourceId: KONG_PROD_EU, resourceType: 'ComponentInstance' },
    annotations: promql(
      'sum(increase(kube_pod_container_status_restarts_total{namespace="kong",container="kong"}[1h]))',
    ),
  },
  {
    metricInstanceId: MI.backendRestarts,
    displayName: 'Container restarts of App Backend (ber-prod)',
    metricRef: { metricId: M.podRestarts },
    subject: { resourceId: APP_BACKEND_PROD_EU, resourceType: 'ComponentInstance' },
    annotations: promql(
      'sum(increase(kube_pod_container_status_restarts_total{namespace="app",container="app-backend"}[1h]))',
    ),
  },
  // --- saturation
  {
    metricInstanceId: MI.backendCpu,
    displayName: 'CPU utilization for App Backend (ber-prod)',
    description: 'Two readings: a 1 minute and a 15 minute average against the CPU limit.',
    metricRef: { metricId: M.cpuUtilization },
    subject: { resourceId: APP_BACKEND_PROD_EU, resourceType: 'ComponentInstance' },
    annotations: promql(
      '100 * sum(rate(container_cpu_usage_seconds_total{namespace="app",container="app-backend"}[1m])) / sum(kube_pod_container_resource_limits{namespace="app",container="app-backend",resource="cpu"})',
    ),
  },
  {
    metricInstanceId: MI.kongCpu,
    displayName: 'CPU utilization for Kong Gateway (ber-prod)',
    metricRef: { metricId: M.cpuUtilization },
    subject: { resourceId: KONG_PROD_EU, resourceType: 'ComponentInstance' },
    annotations: promql(
      '100 * sum(rate(container_cpu_usage_seconds_total{namespace="kong",container="kong"}[1m])) / sum(kube_pod_container_resource_limits{namespace="kong",container="kong",resource="cpu"})',
    ),
  },
  {
    metricInstanceId: MI.grafanaCpu,
    displayName: 'CPU utilization for Grafana Server (prod)',
    description: 'Collected for capacity planning only; no threshold defined.',
    metricRef: { metricId: M.cpuUtilization },
    subject: { resourceId: GRAFANA_PROD, resourceType: 'ComponentInstance' },
    // no thresholds -> unevaluated
    annotations: promql(
      '100 * sum(rate(container_cpu_usage_seconds_total{namespace="monitoring",container="grafana"}[1m])) / sum(kube_pod_container_resource_limits{namespace="monitoring",container="grafana",resource="cpu"})',
    ),
  },
  {
    metricInstanceId: MI.prometheusMemory,
    displayName: 'Memory utilization for Prometheus Server (prod)',
    description: 'Prometheus keeps the TSDB head in memory; the limit is 16 GiB.',
    metricRef: { metricId: M.memoryUtilization },
    subject: { resourceId: PROMETHEUS_PROD, resourceType: 'ComponentInstance' },
    annotations: promql(
      '100 * sum(container_memory_working_set_bytes{namespace="monitoring",container="prometheus"}) / sum(kube_pod_container_resource_limits{namespace="monitoring",container="prometheus",resource="memory"})',
    ),
  },
  {
    metricInstanceId: MI.backendMemory,
    displayName: 'Memory utilization for App Backend (ber-prod)',
    metricRef: { metricId: M.memoryUtilization },
    subject: { resourceId: APP_BACKEND_PROD_EU, resourceType: 'ComponentInstance' },
    annotations: promql(
      '100 * sum(container_memory_working_set_bytes{namespace="app",container="app-backend"}) / sum(kube_pod_container_resource_limits{namespace="app",container="app-backend",resource="memory"})',
    ),
  },
  {
    metricInstanceId: MI.notifierLag,
    displayName: 'Consumer lag of deploy-notifier on deployment.lifecycle',
    description: 'The deploy-notifier group fans deployment events out to chat and e-mail.',
    metricRef: { metricId: M.consumerLag },
    subject: { resourceId: EVENT_BUS_API, resourceType: 'API' },
    annotations: promql(
      'sum(kafka_consumergroup_lag{namespace="app",consumergroup="deploy-notifier",topic="deployment.lifecycle"})',
    ),
  },
  {
    metricInstanceId: MI.indexerLag,
    displayName: 'Consumer lag of artifact-indexer on build.lifecycle',
    description:
      'The artifact-indexer group updates the artifact metadata served by the Query API.',
    metricRef: { metricId: M.consumerLag },
    subject: { resourceId: EVENT_BUS_API, resourceType: 'API' },
    annotations: promql(
      'sum(kafka_consumergroup_lag{namespace="app",consumergroup="artifact-indexer",topic="build.lifecycle"})',
    ),
  },
  {
    metricInstanceId: MI.backendPendingJobs,
    displayName: 'Pending pipeline jobs for App Backend (ber-prod)',
    metricRef: { metricId: M.pendingJobs },
    subject: { resourceId: APP_BACKEND_PROD_EU, resourceType: 'ComponentInstance' },
    annotations: promql('sum(app_pipeline_jobs_pending{namespace="app",container="app-backend"})'),
  },
  {
    metricInstanceId: MI.stagingPendingJobs,
    displayName: 'Pending pipeline jobs for App Backend (staging)',
    description: 'The staging cluster is not scraped yet; no value has been reported.',
    metricRef: { metricId: M.pendingJobs },
    subject: { resourceId: APP_BACKEND_STAGING, resourceType: 'ComponentInstance' },
    // no value -> no reading
    annotations: promql('sum(app_pipeline_jobs_pending{namespace="app",container="app-backend"})'),
  },
  {
    metricInstanceId: MI.prometheusVolume,
    displayName: 'TSDB volume usage of Prometheus Server (prod)',
    description: 'The persistent volume claim prometheus-db-prometheus-0 holding the TSDB blocks.',
    metricRef: { metricId: M.volumeUsage },
    subject: { resourceId: PROMETHEUS_PROD, resourceType: 'ComponentInstance' },
    annotations: promql(
      '100 * kubelet_volume_stats_used_bytes{namespace="monitoring",persistentvolumeclaim="prometheus-db-prometheus-0"} / kubelet_volume_stats_capacity_bytes{namespace="monitoring",persistentvolumeclaim="prometheus-db-prometheus-0"}',
    ),
  },
  // --- no dimension
  {
    metricInstanceId: MI.gatewayCert,
    displayName: 'Certificate validity of the Public Gateway',
    description: 'Probed by the blackbox exporter against the public hostname.',
    metricRef: { metricId: M.certValidity },
    subject: { resourceId: PUBLIC_GATEWAY_API, resourceType: 'API' },
    annotations: promql(
      '(probe_ssl_earliest_cert_expiry{job="blackbox-https",instance="https://api.emeland.example"} - time()) / 86400',
    ),
  },
  // --- unmapped
  {
    metricInstanceId: MI.orphanQueue,
    displayName: 'Legacy batch queue depth',
    description: 'Orphan instance — metric vocabulary entry was removed.',
    // no metricRef -> unmapped
    annotations: [
      { key: 'emeland.io/metric.expression', value: 'legacy_batch_queue_depth' },
      { key: 'emeland.io/metric.language', value: 'text' },
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
  // latency
  value(1, MI.sensorALatency, 'Current p95 latency', '1840'),
  value(2, MI.sensorBLatency, 'Current p95 latency', '310'),
  value(3, MI.commandApiLatency, 'Current p99 latency', '412'),
  value(4, MI.queryApiLatency, 'Current p99 latency', '96'),
  value(5, MI.gatewayLatency, 'Current p99 latency', '188'),
  // traffic
  value(6, MI.commandApiRate, 'Current rate', '42.7'),
  value(7, MI.queryApiRate, 'Current rate', '318.4'),
  value(8, MI.gatewayRate, 'Current rate', '1250'),
  value(9, MI.buildTopicThroughput, 'Current throughput', '85.2'),
  value(10, MI.deploymentTopicThroughput, 'Current throughput', '12.6'),
  // errors
  value(11, MI.commandApiErrors, 'Current error rate', '0.012'),
  value(12, MI.appErrorsPercent, 'Current error rate', '1.2'),
  value(13, MI.gatewayErrors, 'Current error rate', '0.061'),
  value(14, MI.deploymentDlq, 'Parked events', '7'),
  value(15, MI.buildDlq, 'Parked events', '0'),
  value(16, MI.kongRestarts, 'Restarts in the last hour', '4'),
  value(17, MI.backendRestarts, 'Restarts in the last hour', '0'),
  // saturation
  value(18, MI.backendCpu, '1 minute average', '91'),
  value(19, MI.backendCpu, '15 minute average', '78'),
  value(20, MI.kongCpu, '1 minute average', '34'),
  value(21, MI.grafanaCpu, '1 minute average', '12'),
  value(22, MI.prometheusMemory, 'Current working set', '82'),
  value(23, MI.backendMemory, 'Current working set', '63'),
  value(24, MI.notifierLag, 'Current lag', '18234'),
  value(25, MI.indexerLag, 'Current lag', '42'),
  value(26, MI.backendPendingJobs, 'Current queue', '143'),
  value(27, MI.prometheusVolume, 'Current usage', '71'),
  // no dimension
  value(28, MI.gatewayCert, 'Days until expiry', '12'),
  // unmapped
  value(29, MI.orphanQueue, 'Current queue depth', '2401'),
  {
    metricValueId: mv(30),
    displayName: 'Current saturation state',
    description: 'Non-numeric reading reported by the gateway health check.',
    metricInstanceRef: { metricInstanceId: MI.gatewaySaturation },
    value: 'degraded',
    annotations: [],
  },
] satisfies MetricValueWire[]

export const thresholds = [
  // latency
  limit(1, MI.sensorALatency, 'sensor delivery warning', 'gt', '5000'),
  limit(2, MI.sensorBLatency, 'sensor delivery warning', 'gt', '5000'),
  {
    ...limit(3, MI.commandApiLatency, 'Command API p99 warning', 'gt', '300'),
    description: 'Warn when p99 exceeds 300 ms.',
  },
  {
    thresholdId: th(4),
    displayName: 'Command API p99 critical',
    description: 'Critical when p99 exceeds 500 ms.',
    metricInstanceRef: { metricInstanceId: MI.commandApiLatency },
    annotations: [
      { key: 'emeland.io/threshold.expression', value: 'value > 500' },
      { key: 'emeland.io/threshold.language', value: 'cel' },
    ],
  },
  limit(5, MI.queryApiLatency, 'Query API p99 warning', 'gt', '300'),
  limit(6, MI.gatewayLatency, 'gateway p99 warning', 'gt', '500'),
  {
    ...limit(7, MI.gatewayLatency, 'gateway p99 sanity floor', 'lt', '5'),
    description: 'A p99 below 5 ms means the probe is not seeing real traffic.',
  },
  // traffic
  limit(8, MI.queryApiRate, 'Query API rate floor', 'lt', '1'),
  {
    ...limit(9, MI.gatewayRate, 'gateway rate limit reached', 'ge', '5000'),
    description: 'The rate limit plugin starts rejecting requests at 5000 req/s.',
  },
  limit(10, MI.gatewayRate, 'gateway receives no traffic', 'lt', '1'),
  {
    ...limit(11, MI.buildTopicThroughput, 'no build events', 'lt', '0.1'),
    description: 'Builds run around the clock; silence on the topic means the producers are down.',
  },
  // errors
  limit(12, MI.commandApiErrors, 'Command API error-rate warning', 'gt', '0.05'),
  {
    ...limit(13, MI.appErrorsPercent, 'application error-rate warning', 'gt', '5'),
    description: 'Warn above 5 percent.',
  },
  {
    ...limit(14, MI.gatewayErrors, 'gateway error-rate warning', 'gt', '0.05'),
    description: 'The availability SLO allows 5 percent failed requests.',
  },
  limit(15, MI.deploymentDlq, 'dead-letter events present', 'gt', '0'),
  limit(16, MI.buildDlq, 'dead-letter events present', 'gt', '0'),
  {
    ...limit(17, MI.kongRestarts, 'gateway restart loop', 'ge', '3'),
    description: 'Three restarts within an hour usually mean a crash loop.',
  },
  limit(18, MI.backendRestarts, 'backend restart loop', 'ge', '3'),
  // saturation
  {
    ...limit(19, MI.backendCpu, 'backend CPU warning', 'ge', '85'),
    description: 'Warn at 85 percent sustained load.',
  },
  limit(20, MI.backendCpu, 'backend CPU critical', 'ge', '95'),
  limit(21, MI.kongCpu, 'gateway CPU warning', 'ge', '85'),
  {
    ...limit(22, MI.prometheusMemory, 'Prometheus memory warning', 'ge', '90'),
    description: 'Above 90 percent the pod risks an OOM kill during compaction.',
  },
  limit(23, MI.backendMemory, 'backend memory warning', 'ge', '90'),
  {
    ...limit(24, MI.notifierLag, 'deploy-notifier lag warning', 'gt', '10000'),
    description: 'The notification SLO allows at most 10k unprocessed deployment events.',
  },
  limit(25, MI.indexerLag, 'artifact-indexer lag warning', 'gt', '10000'),
  limit(26, MI.backendPendingJobs, 'job queue warning', 'ge', '1000'),
  limit(27, MI.backendPendingJobs, 'job queue critical', 'ge', '5000'),
  limit(28, MI.stagingPendingJobs, 'job queue warning', 'ge', '1000'),
  limit(29, MI.prometheusVolume, 'TSDB volume warning', 'ge', '80'),
  limit(30, MI.prometheusVolume, 'TSDB volume critical', 'ge', '90'),
  // no dimension
  {
    ...limit(31, MI.gatewayCert, 'certificate renewal due', 'lt', '30'),
    description: 'Renew certificates at least 30 days before expiry.',
  },
  limit(32, MI.gatewayCert, 'certificate expiry imminent', 'le', '7'),
  // unmapped
  {
    thresholdId: th(33),
    displayName: 'gateway degraded',
    metricInstanceRef: { metricInstanceId: MI.gatewaySaturation },
    annotations: [
      { key: 'emeland.io/threshold.expression', value: 'value == "degraded"' },
      { key: 'emeland.io/threshold.language', value: 'cel' },
    ],
  },
] satisfies ThresholdWire[]

function value(n: number, metricInstanceId: string, displayName: string, value: string) {
  return {
    metricValueId: mv(n),
    displayName,
    metricInstanceRef: { metricInstanceId },
    value,
    annotations: [],
  } satisfies MetricValueWire
}

function limit(
  n: number,
  metricInstanceId: string,
  displayName: string,
  op: string,
  limit: string,
) {
  return {
    thresholdId: th(n),
    displayName,
    metricInstanceRef: { metricInstanceId },
    annotations: [
      { key: 'emeland.io/threshold.operator', value: op },
      { key: 'emeland.io/threshold.limit', value: limit },
    ],
  } satisfies ThresholdWire
}
