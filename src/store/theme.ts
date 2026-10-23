import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type Theme = 'light' | 'dark'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>('light')

  const isDark = ref(false)

  function setTheme(newTheme: Theme) {
    theme.value = newTheme
    isDark.value = newTheme === 'dark'
    updateDocumentTheme(newTheme)
  }

  function toggleTheme() {
    const newTheme: Theme = isDark.value ? 'light' : 'dark'
    setTheme(newTheme)
  }

  function updateDocumentTheme(t: Theme) {
    const html = document.documentElement
    if (t === 'dark') {
      html.setAttribute('data-theme', 'dark')
    } else {
      html.setAttribute('data-theme', 'light')
    }
  }

  function initTheme() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    let initialTheme: Theme = prefersDark ? 'dark' : 'light'
    try {
      const saved = localStorage.getItem('drawwat-theme')
      // Accept the previous Pinia object as well as the current string format.
      const value = saved && saved.startsWith('{') ? JSON.parse(saved).theme : saved
      if (value === 'light' || value === 'dark') initialTheme = value
    } catch { /* Fall back to the system theme when storage is unavailable. */ }
    setTheme(initialTheme)
  }

  watch(theme, (t) => {
    try { localStorage.setItem('drawwat-theme', t) } catch { /* Theme still works without persistence. */ }
  })

  return {
    theme,
    isDark,
    setTheme,
    toggleTheme,
    initTheme
  }
})
