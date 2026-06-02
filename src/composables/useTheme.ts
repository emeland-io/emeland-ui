import { ref, watchEffect } from 'vue'

const theme = ref<'dark' | 'light'>('dark')

export function useTheme() {
  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  watchEffect(() => {
    document.documentElement.setAttribute('data-theme', theme.value)
  })

  return { theme, toggleTheme }
}
