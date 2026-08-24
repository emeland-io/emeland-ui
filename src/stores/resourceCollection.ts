import { ref, computed, type Ref } from 'vue'
import { useResourceErrors, loadDetailInto } from '@/composables/useResourceErrors'
import { loadOnce, loadDetailRef, groupBy } from './support'

/**
 * The shared store machinery of the six resource stores: list state with
 * load-once semantics, per-id detail hydration (guarded + deduped), and
 * optional instances and types sub-collections. Called inside a pinia
 * defineStore setup; the store module aliases the generic members to its
 * resource-specific names.
 */
export function createResourceCollection<T, TInst = unknown, TType = unknown>(options: {
  idOf: (item: T) => string
  fetchAll: () => Promise<T[]>
  fetchById: (id: string) => Promise<T>
  /** patch a fetched detail before it replaces the list item (e.g. id fallback) */
  mergeDetail?: (full: T, id: string) => T
  instances?: {
    idOf: (inst: TInst) => string
    /** the instance's parent resource reference ('' when absent) */
    parentOf: (inst: TInst) => string | undefined
    fetchAll: () => Promise<TInst[]>
    fetchById: (id: string) => Promise<TInst>
  }
  types?: {
    idOf: (type: TType) => string
    fetchAll: () => Promise<TType[]>
    fetchById: (id: string) => Promise<TType>
  }
}) {
  const items = ref<T[]>([]) as Ref<T[]>
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)
  const detailsHydrated = ref(false)

  // ids hydrated with their full detail; in-flight detail fetches
  const hydrated = new Set<string>()
  const inflightDetail = new Map<string, Promise<void>>()

  const errs = useResourceErrors()

  const map = computed(() => new Map(items.value.map((i) => [options.idOf(i), i])))

  async function load() {
    await loadOnce(
      { loading, loaded, error },
      async () => {
        items.value = await options.fetchAll()
      },
      { resetError: true },
    )
  }

  async function loadDetail(id: string): Promise<void> {
    if (hydrated.has(id)) return
    const inflight = inflightDetail.get(id)
    if (inflight) return inflight

    const p = loadDetailInto(
      id,
      options.fetchById,
      (full) => {
        const detail = options.mergeDetail ? options.mergeDetail(full, id) : full
        items.value = items.value.map((i) => (options.idOf(i) === id ? detail : i))
        hydrated.add(id)
      },
      errs,
    ).finally(() => inflightDetail.delete(id))

    inflightDetail.set(id, p)
    return p
  }

  async function loadAllDetails(): Promise<void> {
    if (detailsHydrated.value) return
    await Promise.all(items.value.map((i) => loadDetail(options.idOf(i))))
    detailsHydrated.value = true
  }

  // ---- optional instances sub-collection ----
  const inst = options.instances
  const instanceItems = ref<TInst[]>([]) as Ref<TInst[]>
  const instancesLoading = ref(false)
  const instancesLoaded = ref(false)

  const instanceMap = computed(() => new Map(instanceItems.value.map((i) => [inst!.idOf(i), i])))
  const instancesByParent = computed(() => groupBy(instanceItems.value, (i) => inst!.parentOf(i)))

  function getInstancesFor(id: string): TInst[] {
    return instancesByParent.value.get(id) ?? []
  }

  // instances whose parent reference is absent or unresolvable
  const unmappedInstances = computed(() =>
    inst
      ? instanceItems.value.filter((i) => {
          const parent = inst.parentOf(i)
          return !parent || !map.value.has(parent)
        })
      : [],
  )

  async function loadInstances(): Promise<void> {
    if (!inst) return
    await loadOnce({ loading: instancesLoading, loaded: instancesLoaded, error }, async () => {
      const list = await inst.fetchAll()
      // the list endpoint is minimal, so hydrate each instance by id
      instanceItems.value = await Promise.all(
        list.map((i) => inst.fetchById(inst.idOf(i)).catch(() => i)),
      )
    })
  }

  // ---- optional types sub-collection ----
  const typ = options.types
  const typeItems = ref<TType[]>([]) as Ref<TType[]>
  const typesLoading = ref(false)
  const typesLoaded = ref(false)
  const selectedTypeDetail = ref<TType | null>(null) as Ref<TType | null>

  const typeMap = computed(() => new Map(typeItems.value.map((t) => [typ!.idOf(t), t])))

  async function loadTypes(): Promise<void> {
    if (!typ) return
    await loadOnce({ loading: typesLoading, loaded: typesLoaded, error }, async () => {
      typeItems.value = await typ.fetchAll()
    })
  }

  async function loadTypeDetail(id: string): Promise<void> {
    if (!typ) return
    await loadDetailRef(selectedTypeDetail, () => typ.fetchById(id))
  }

  return {
    items,
    loading,
    loaded,
    error,
    detailsHydrated,
    map,
    load,
    loadDetail,
    loadAllDetails,
    /** detail/missing error tracking (hasDetailError; also markMissing/isMissing) */
    errs,
    hasDetailError: errs.hasDetailError,
    instances: {
      items: instanceItems,
      loading: instancesLoading,
      loaded: instancesLoaded,
      map: instanceMap,
      byParent: instancesByParent,
      getFor: getInstancesFor,
      unmapped: unmappedInstances,
      load: loadInstances,
    },
    types: {
      items: typeItems,
      loading: typesLoading,
      loaded: typesLoaded,
      map: typeMap,
      selectedDetail: selectedTypeDetail,
      load: loadTypes,
      loadDetail: loadTypeDetail,
    },
  }
}
