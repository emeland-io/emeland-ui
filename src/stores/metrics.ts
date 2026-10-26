import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  fetchMetricById,
  fetchMetricInstanceById,
  fetchMetricInstances,
  fetchMetrics,
  fetchMetricValueById,
  fetchMetricValues,
  fetchThresholdById,
  fetchThresholds,
} from '@/api/metrics'
import type { Metric, MetricInstance, MetricValue, Threshold, InstanceStatus } from '@/types/metric'
import { compareByName, instanceStatus, metricDimension } from '@/types/metric'
import type { ResourceType } from '@/types/common'
import { createResourceCollection } from './resourceCollection'
import { groupBy, loadOnce } from './support'
import { reportError } from '@/utils/errors'
import { useToasts } from '@/composables/useToasts'
import { useResourceErrors } from '@/composables/useResourceErrors'

export const useMetricsStore = defineStore('metrics', () => {
  const res = createResourceCollection<Metric, MetricInstance>({
    idOf: (m) => m.metricId,
    fetchAll: fetchMetrics,
    fetchById: fetchMetricById,
    instances: {
      idOf: (i) => i.metricInstanceId,
      parentOf: (i) => i.metricId,
      fetchAll: fetchMetricInstances,
      fetchById: fetchMetricInstanceById,
    },
  })

  // ---- thresholds + values (keyed by metricInstanceId) ----
  const thresholds = ref<Threshold[]>([])
  const thresholdsLoading = ref(false)
  const thresholdsLoaded = ref(false)
  const thresholdsError = ref<string | null>(null)

  const metricValues = ref<MetricValue[]>([])
  const valuesLoading = ref(false)
  const valuesLoaded = ref(false)
  const valuesError = ref<string | null>(null)

  const relatedErrs = useResourceErrors()

  // modelsrv serves map order; sort once per collection so every consumer agrees
  const thresholdsByInstance = computed(() =>
    groupBy(
      [...thresholds.value].sort((a, b) => compareByName(a, b, (t) => t.thresholdId)),
      (t) => t.metricInstanceId,
    ),
  )
  const valuesByInstance = computed(() =>
    groupBy(
      [...metricValues.value].sort((a, b) => compareByName(a, b, (v) => v.metricValueId)),
      (v) => v.metricInstanceId,
    ),
  )

  function getThresholdsFor(instanceId: string): Threshold[] {
    return thresholdsByInstance.value.get(instanceId) ?? []
  }

  function getValuesFor(instanceId: string): MetricValue[] {
    return valuesByInstance.value.get(instanceId) ?? []
  }

  function getInstancesForMetric(metricId: string): MetricInstance[] {
    return [...res.instances.getFor(metricId)].sort((a, b) =>
      compareByName(a, b, (i) => i.metricInstanceId),
    )
  }

  /** derived client-side from the current values and operator thresholds */
  function statusFor(instanceId: string): InstanceStatus {
    return instanceStatus(getThresholdsFor(instanceId), getValuesFor(instanceId))
  }

  const statusByInstance = computed(() => {
    const m = new Map<string, InstanceStatus>()
    for (const inst of res.instances.items.value) {
      m.set(inst.metricInstanceId, statusFor(inst.metricInstanceId))
    }
    return m
  })

  const breachedCount = computed(
    () => [...statusByInstance.value.values()].filter((s) => s === 'breached').length,
  )

  async function hydrateList<T>(
    list: T[],
    idOf: (item: T) => string,
    fetchById: (id: string) => Promise<T>,
  ): Promise<T[]> {
    let failed = 0
    const hydrated = await Promise.all(
      list.map((item) =>
        fetchById(idOf(item)).catch((e: unknown) => {
          failed++
          relatedErrs.markDetailError(idOf(item), reportError('store.metrics.related', e))
          return item
        }),
      ),
    )
    if (failed > 0) {
      useToasts().push(`${failed} of ${list.length} related details failed to load`, 'warning')
    }
    return hydrated
  }

  async function loadThresholds(): Promise<void> {
    await loadOnce(
      { loading: thresholdsLoading, loaded: thresholdsLoaded, error: thresholdsError },
      async () => {
        const list = await fetchThresholds()
        thresholds.value = await hydrateList(list, (t) => t.thresholdId, fetchThresholdById)
      },
      { resetError: true },
    )
    if (thresholdsError.value) {
      useToasts().pushError(`Could not load thresholds: ${thresholdsError.value}`)
    }
  }

  async function loadMetricValues(): Promise<void> {
    await loadOnce(
      { loading: valuesLoading, loaded: valuesLoaded, error: valuesError },
      async () => {
        const list = await fetchMetricValues()
        metricValues.value = await hydrateList(list, (v) => v.metricValueId, fetchMetricValueById)
      },
      { resetError: true },
    )
    if (valuesError.value) {
      useToasts().pushError(`Could not load metric values: ${valuesError.value}`)
    }
  }

  async function loadRelated(): Promise<void> {
    await Promise.all([res.instances.load(), loadThresholds(), loadMetricValues()])
  }

  async function reload(): Promise<void> {
    thresholdsLoaded.value = false
    valuesLoaded.value = false
    await res.reload()
    await Promise.all([loadThresholds(), loadMetricValues()])
  }

  /** distinct `emeland.io/dimension` values across the vocabulary */
  const dimensions = computed(() =>
    [...new Set(res.items.value.map(metricDimension).filter((d): d is string => !!d))].sort(),
  )

  /** distinct subject resource types across all instances */
  const subjectTypes = computed<ResourceType[]>(() =>
    [
      ...new Set(
        res.instances.items.value
          .map((i) => i.subject?.resourceType)
          .filter((t): t is ResourceType => !!t),
      ),
    ].sort(),
  )

  return {
    metrics: res.items,
    metricInstances: res.instances.items,
    thresholds,
    metricValues,
    loading: res.loading,
    loaded: res.loaded,
    error: res.error,
    instancesLoading: res.instances.loading,
    instancesLoaded: res.instances.loaded,
    thresholdsLoading,
    thresholdsLoaded,
    valuesLoading,
    valuesLoaded,
    detailsHydrated: res.detailsHydrated,
    metricMap: res.map,
    metricInstanceMap: res.instances.map,
    instancesByMetric: res.instances.byParent,
    unmappedInstances: res.instances.unmapped,
    getInstancesForMetric,
    getThresholdsFor,
    getValuesFor,
    statusFor,
    statusByInstance,
    breachedCount,
    dimensions,
    subjectTypes,
    hasDetailError: res.hasDetailError,
    detailErrorMessage: res.detailErrorMessage,
    load: res.load,
    reload,
    loadMetricDetail: res.loadDetail,
    loadAllDetails: res.loadAllDetails,
    loadMetricInstances: res.instances.load,
    loadThresholds,
    loadMetricValues,
    loadRelated,
  }
})
