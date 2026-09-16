import { computed, ref, type Ref } from 'vue'
import { safeStorage } from '@/utils/storage'
import { toggledSet } from '@/utils/set'

/**
 * Favorites are a per-browser bookmark list, not landscape state
 */
const STORAGE_PREFIX = 'emeland-favorites-'

const registry = new Map<string, Ref<Set<string>>>()

function read(key: string): Set<string> {
  const raw = safeStorage()?.getItem(key)
  if (!raw) return new Set()
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((id): id is string => typeof id === 'string'))
  } catch {
    return new Set()
  }
}

function write(key: string, ids: Set<string>) {
  try {
    safeStorage()?.setItem(key, JSON.stringify([...ids]))
  } catch {
    // private browsing rejects writes even when storage looks usable,
    // favorites still work for the rest of the session
  }
}

function registerCollection(key: string): Ref<Set<string>> {
  const existing = registry.get(key)
  if (existing) return existing

  const favorites = ref(read(key))
  registry.set(key, favorites)

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e: StorageEvent) => {
      if (e.key === key) favorites.value = read(key)
    })
  }
  return favorites
}

export function useFavorites(collection = 'capabilities') {
  const key = STORAGE_PREFIX + collection
  const favorites = registerCollection(key)

  function isFavorite(id: string): boolean {
    return favorites.value.has(id)
  }

  function toggleFavorite(id: string) {
    favorites.value = toggledSet(favorites.value, id)
    write(key, favorites.value)
  }

  function clearFavorites() {
    favorites.value = new Set()
    write(key, favorites.value)
  }

  return {
    favorites: computed(() => favorites.value),
    favoriteCount: computed(() => favorites.value.size),
    isFavorite,
    toggleFavorite,
    clearFavorites,
  }
}

export function resetFavoritesRegistry() {
  registry.clear()
}
