import type { UUID, Annotations, ResourceType } from './common'

export const METRIC_ANN = {
  unit: 'emeland.io/unit',
  dimension: 'emeland.io/dimension',
  expression: 'emeland.io/metric.expression',
  language: 'emeland.io/metric.language',
} as const

export const THRESHOLD_ANN = {
  expression: 'emeland.io/threshold.expression',
  language: 'emeland.io/threshold.language',
  operator: 'emeland.io/threshold.operator',
  limit: 'emeland.io/threshold.limit',
} as const

export interface Metric {
  metricId: UUID
  displayName: string
  description?: string
  annotations: Annotations
}

export interface MetricSubject {
  resourceId: UUID
  resourceType: ResourceType
}

export interface MetricInstance {
  metricInstanceId: UUID
  displayName: string
  description?: string
  metricId?: UUID
  subject?: MetricSubject
  annotations: Annotations
}

export interface Threshold {
  thresholdId: UUID
  displayName: string
  description?: string
  metricInstanceId: UUID
  annotations: Annotations
}

export interface MetricValue {
  metricValueId: UUID
  displayName: string
  description?: string
  metricInstanceId: UUID
  value: string
  annotations: Annotations
}

export function metricUnit(m: Metric): string | undefined {
  return m.annotations[METRIC_ANN.unit]
}

export function metricDimension(m: Metric): string | undefined {
  return m.annotations[METRIC_ANN.dimension]
}

/** unit of an instance: its own `emeland.io/unit` override, else the metric's */
export function instanceUnit(inst: MetricInstance, metric?: Metric): string | undefined {
  return inst.annotations[METRIC_ANN.unit] ?? (metric ? metricUnit(metric) : undefined)
}

export function metricExpression(ann: Annotations): string | undefined {
  return ann[METRIC_ANN.expression]
}

export function metricLanguage(ann: Annotations): string | undefined {
  return ann[METRIC_ANN.language]
}

// ---- thresholds ----

/** operator codes of `emeland.io/threshold.operator`, rendered as symbols */
export const THRESHOLD_OPERATORS = {
  gt: '>',
  ge: '≥',
  lt: '<',
  le: '≤',
  eq: '=',
  ne: '≠',
} as const

export type ThresholdOperator = keyof typeof THRESHOLD_OPERATORS

export function isThresholdOperator(op: string): op is ThresholdOperator {
  return op in THRESHOLD_OPERATORS
}

export type ThresholdCondition =
  | { kind: 'operator'; operator: string; limit: string }
  | { kind: 'expression'; expression: string; language?: string }

export function thresholdCondition(t: Threshold): ThresholdCondition | undefined {
  const expression = t.annotations[THRESHOLD_ANN.expression]
  if (expression) {
    return { kind: 'expression', expression, language: t.annotations[THRESHOLD_ANN.language] }
  }
  const operator = t.annotations[THRESHOLD_ANN.operator]
  const limit = t.annotations[THRESHOLD_ANN.limit]
  if (operator || limit) {
    return { kind: 'operator', operator: operator ?? '', limit: limit ?? '' }
  }
  return undefined
}

export function thresholdLanguage(t: Threshold): string | undefined {
  return t.annotations[THRESHOLD_ANN.language]
}

export function formatThreshold(t: Threshold, unit?: string): string | undefined {
  const c = thresholdCondition(t)
  if (!c) return undefined
  if (c.kind === 'expression') return c.expression
  const symbol = isThresholdOperator(c.operator) ? THRESHOLD_OPERATORS[c.operator] : c.operator
  const parts = [symbol, c.limit, c.limit && unit ? unit : ''].filter(Boolean)
  return parts.join(' ')
}

export function parseMetricNumber(value: string): number | undefined {
  const s = value.trim()
  if (!s) return undefined
  const n = Number(s)
  return Number.isFinite(n) ? n : undefined
}

export type ThresholdVerdict = 'breached' | 'ok' | 'unknown'

export function evaluateThreshold(t: Threshold, value: string): ThresholdVerdict {
  const c = thresholdCondition(t)
  if (!c || c.kind !== 'operator' || !isThresholdOperator(c.operator)) return 'unknown'
  const v = parseMetricNumber(value)
  const limit = parseMetricNumber(c.limit)
  if (v === undefined || limit === undefined) return 'unknown'
  const breached = {
    gt: v > limit,
    ge: v >= limit,
    lt: v < limit,
    le: v <= limit,
    eq: v === limit,
    ne: v !== limit,
  }[c.operator]
  return breached ? 'breached' : 'ok'
}

export function orderedThresholds(thresholds: Threshold[], values: MetricValue[]): Threshold[] {
  const rank = (t: Threshold) => {
    if (values.some((v) => evaluateThreshold(t, v.value) === 'breached')) return 0
    return thresholdCondition(t)?.kind === 'operator' ? 1 : 2
  }
  const limit = (t: Threshold) => {
    const c = thresholdCondition(t)
    return c?.kind === 'operator' ? parseMetricNumber(c.limit) : undefined
  }
  return [...thresholds].sort(
    (a, b) => rank(a) - rank(b) || (limit(a) ?? Infinity) - (limit(b) ?? Infinity),
  )
}

export type InstanceStatus = 'breached' | 'ok' | 'unknown' | 'no-reading'

/** every status in display order: the worst first */
export const INSTANCE_STATUSES: readonly InstanceStatus[] = [
  'breached',
  'ok',
  'unknown',
  'no-reading',
]

export const INSTANCE_STATUS_LABEL: Record<InstanceStatus, string> = {
  breached: 'over limit',
  ok: 'within limits',
  unknown: 'unevaluated',
  'no-reading': 'no reading',
}

/** tooltip explaining each status, the derivation happens client-side */
export const INSTANCE_STATUS_TITLE: Record<InstanceStatus, string> = {
  breached: 'A current value breaches an operator threshold (derived client-side)',
  ok: 'All evaluable thresholds hold for the current values (derived client-side)',
  unknown: 'No threshold could be evaluated: none defined, expression-only, or non-numeric value',
  'no-reading': 'No current value reported',
}

export function instanceStatus(thresholds: Threshold[], values: MetricValue[]): InstanceStatus {
  if (values.length === 0) return 'no-reading'
  let evaluated = false
  for (const t of thresholds) {
    for (const v of values) {
      const verdict = evaluateThreshold(t, v.value)
      if (verdict === 'breached') return 'breached'
      if (verdict === 'ok') evaluated = true
    }
  }
  return evaluated ? 'ok' : 'unknown'
}

/** stable order for server lists (modelsrv serves map order): name, then id */
export function compareByName<T extends { displayName: string }>(
  a: T,
  b: T,
  idOf: (item: T) => string,
): number {
  return a.displayName.localeCompare(b.displayName) || idOf(a).localeCompare(idOf(b))
}
