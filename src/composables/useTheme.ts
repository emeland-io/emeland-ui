import { ref, watchEffect } from 'vue'

export type ThemeMode = 'system' | 'light' | 'dark' | 'demo-old'

export const THEME_MODES: Exclude<ThemeMode, 'system'>[] = ['light', 'dark', 'demo-old']

const STORAGE_KEY = 'emeland-theme'

function readStored(): ThemeMode {
  const v = localStorage.getItem(STORAGE_KEY)
  return v === 'system' || (v && (THEME_MODES as string[]).includes(v))
    ? (v as ThemeMode)
    : 'system'
}

const theme = ref<ThemeMode>(readStored())

function resolved(): string {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  if (theme.value === 'system') return prefersDark ? 'dark' : 'light'
  if (theme.value === 'demo-old') return prefersDark ? 'demo-old-dark' : 'demo-old-light'
  return theme.value
}

watchEffect(() => {
  localStorage.setItem(STORAGE_KEY, theme.value)
  document.documentElement.setAttribute('data-theme', resolved())
})

// Re-apply when the OS theme changes while in 'system' mode
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (theme.value === 'system') {
    document.documentElement.setAttribute('data-theme', resolved())
  }
})

export function useTheme() {
  function setTheme(mode: ThemeMode) {
    theme.value = mode
  }
  return { theme, setTheme }
}
