import { watch, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { resourceQueryKey, routeForResource } from '@/constants/resources'
import type { ResourceQueryKey } from '@/constants/resources'
import type { ResourceType } from '@/types/common'

const QUERY_KEYS: ResourceQueryKey[] = ['select', 'instance', 'type']

export function useResourceNav() {
  const route = useRoute()
  const router = useRouter()

  function queryFor(name: string, key: ResourceQueryKey, resourceId: string) {
    const query = route.name === name ? { ...route.query } : {}
    for (const k of QUERY_KEYS) delete query[k]
    return { ...query, [key]: resourceId }
  }

  function goToResource(resourceType: ResourceType, resourceId: string) {
    const name = routeForResource(resourceType)
    if (!name) return
    router.push({ name, query: queryFor(name, resourceQueryKey(resourceType), resourceId) })
  }

  function goToFinding(findingId: string) {
    router.push({ name: 'Findings', query: queryFor('Findings', 'select', findingId) })
  }

  return { goToResource, goToFinding }
}

/**
 * Acts on `?<key>=<id>` once `ready(id)` holds (the data it needs has loaded),
 * then strips the key so a reload or a later click starts fresh. `ready` is
 * tracked, so loading the data later still triggers the handler
 */
export function useQueryTarget(
  key: ResourceQueryKey,
  ready: (id: string) => boolean,
  handle: (id: string) => void,
) {
  const route = useRoute()
  const router = useRouter()

  watch(
    () => {
      const value = route.query[key]
      return typeof value === 'string' && ready(value) ? value : undefined
    },
    (id) => {
      if (!id) return
      handle(id)
      const query = { ...route.query }
      delete query[key]
      router.replace({ query })
    },
    { immediate: true },
  )
}

export function useSelectQuery<T>(
  selectedId: Ref<string>,
  items: Ref<readonly T[]>,
  idOf: (item: T) => string,
) {
  useQueryTarget(
    'select',
    (id) => items.value.some((it) => idOf(it) === id),
    (id) => {
      selectedId.value = id
    },
  )
}
