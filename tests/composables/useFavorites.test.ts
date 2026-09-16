import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useFavorites, resetFavoritesRegistry } from '@/composables/useFavorites'

const KEY = 'emeland-favorites-capabilities'

function fakeStorage(overrides: Partial<Storage> = {}): Storage {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v)
    },
    removeItem: (k: string) => {
      map.delete(k)
    },
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size
    },
    ...overrides,
  } as Storage
}

function stored(): string[] {
  return JSON.parse(localStorage.getItem(KEY) ?? '[]')
}

beforeEach(() => {
  vi.stubGlobal('localStorage', fakeStorage())
  resetFavoritesRegistry()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useFavorites', () => {
  it('starts empty and toggles ids on and off', () => {
    const { isFavorite, toggleFavorite, favoriteCount } = useFavorites()
    expect(favoriteCount.value).toBe(0)

    toggleFavorite('cap-a')
    expect(isFavorite('cap-a')).toBe(true)
    expect(favoriteCount.value).toBe(1)

    toggleFavorite('cap-a')
    expect(isFavorite('cap-a')).toBe(false)
    expect(favoriteCount.value).toBe(0)
  })

  it('persists to localStorage and reads them back on the next load', () => {
    useFavorites().toggleFavorite('cap-a')
    useFavorites().toggleFavorite('cap-b')
    expect(stored()).toEqual(['cap-a', 'cap-b'])

    resetFavoritesRegistry() // a fresh page load re-reads storage
    const { isFavorite, favoriteCount } = useFavorites()
    expect(favoriteCount.value).toBe(2)
    expect(isFavorite('cap-b')).toBe(true)
  })

  it('shares one reactive set across call sites', () => {
    const a = useFavorites()
    const b = useFavorites()
    a.toggleFavorite('cap-a')
    expect(b.isFavorite('cap-a')).toBe(true)
    expect(b.favoriteCount.value).toBe(1)
  })

  it('keeps collections independent', () => {
    useFavorites('capabilities').toggleFavorite('cap-a')
    expect(useFavorites('orders').isFavorite('cap-a')).toBe(false)
  })

  it('ignores corrupt, non-array and non-string stored values', () => {
    for (const [raw, expected] of [
      ['{not json', 0],
      ['{"a":1}', 0],
      ['["cap-a", 42, null]', 1],
    ] as const) {
      localStorage.setItem(KEY, raw)
      resetFavoritesRegistry()
      expect(useFavorites().favoriteCount.value, raw).toBe(expected)
    }
  })

  it('keeps favorites for the session when storage rejects writes', () => {
    vi.stubGlobal(
      'localStorage',
      fakeStorage({
        setItem: () => {
          throw new DOMException('QuotaExceededError')
        },
      }),
    )
    resetFavoritesRegistry()

    const { toggleFavorite, isFavorite } = useFavorites()
    expect(() => toggleFavorite('cap-a')).not.toThrow()
    expect(isFavorite('cap-a')).toBe(true)
  })

  it('works in memory when storage is unusable altogether', () => {
    vi.stubGlobal('localStorage', {})
    resetFavoritesRegistry()

    const { toggleFavorite, isFavorite, favoriteCount } = useFavorites()
    expect(() => toggleFavorite('cap-a')).not.toThrow()
    expect(isFavorite('cap-a')).toBe(true)
    expect(favoriteCount.value).toBe(1)
  })

  it('clears every favorite', () => {
    const { toggleFavorite, clearFavorites, favoriteCount } = useFavorites()
    toggleFavorite('cap-a')
    toggleFavorite('cap-b')
    clearFavorites()
    expect(favoriteCount.value).toBe(0)
    expect(stored()).toEqual([])
  })

  it('picks up an edit made in another tab', () => {
    const { favoriteCount, isFavorite } = useFavorites()
    localStorage.setItem(KEY, JSON.stringify(['cap-z']))
    window.dispatchEvent(new StorageEvent('storage', { key: KEY }))

    expect(favoriteCount.value).toBe(1)
    expect(isFavorite('cap-z')).toBe(true)
  })
})
