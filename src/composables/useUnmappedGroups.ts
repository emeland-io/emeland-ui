import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useSystemStore } from '@/stores/systems'
import { groupByBrokenRef } from '@/utils/mapping'

export function useSystemInstanceGroups<T>(
  unmapped: MaybeRefOrGetter<T[]>,
  refOf: (item: T) => string | undefined,
) {
  const systemStore = useSystemStore()

  const groups = computed(() =>
    groupByBrokenRef(
      toValue(unmapped),
      refOf,
      'No system instance',
      (key) => systemStore.systemInstanceMap.get(key)?.displayName,
      (key) => systemStore.systemInstanceMap.has(key),
    ),
  )

  function groupTitle(key: string): string {
    if (!key) return 'No system instance'
    return systemStore.systemInstanceMap.has(key)
      ? key
      : `References missing system instance ${key}`
  }

  return { unmappedGroups: groups, unmappedGroupTitle: groupTitle }
}

export function useSystemRefGroups<T>(
  unmapped: MaybeRefOrGetter<T[]>,
  refOf: (item: T) => string | undefined,
) {
  const groups = computed(() => groupByBrokenRef(toValue(unmapped), refOf, 'No system reference'))

  function groupTitle(key: string): string {
    return key ? `References missing system ${key}` : 'No system reference'
  }

  return { unmappedGroups: groups, unmappedGroupTitle: groupTitle }
}
