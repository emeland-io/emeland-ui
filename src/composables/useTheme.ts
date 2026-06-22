import { ref, watchEffect } from 'vue'

export type ThemeMode = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'emeland-theme'

function readStored(): ThemeMode {
  const v = localStorage.getItem(STORAGE_KEY)
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system'
}

const theme = ref<ThemeMode>(readStored())

// Resolves 'system' to the actual light/dark from the OS preference
function resolved(): 'dark' | 'light' {
  if (theme.value === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
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
