import { watch, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { routeForResource } from '@/constants/resources'
import type { ResourceType } from '@/types/common'

export function useResourceNav() {
  const router = useRouter()

  function goToResource(resourceType: ResourceType, resourceId: string) {
    const name = routeForResource(resourceType)
    if (!name) return
    router.push({ name, query: { select: resourceId } })
  }

  function goToFinding(findingId: string) {
    router.push({ name: 'Findings', query: { select: findingId } })
  }

  return { goToResource, goToFinding }
}

export function useSelectQuery<T>(
  selectedId: Ref<string>,
  items: Ref<readonly T[]>,
  idOf: (item: T) => string,
) {
  const route = useRoute()
  const router = useRouter()

  let applied: string | null = null

  watch(
    () => [items.value, route.query.select] as const,
    ([list, select]) => {
      if (typeof select !== 'string') {
        applied = null
        return
      }
      if (select === applied) return
      if (list.some((it) => idOf(it) === select)) {
        selectedId.value = select
        applied = select
        const query = { ...route.query }
        delete query.select
        router.replace({ query })
      }
    },
    { immediate: true },
  )
}
