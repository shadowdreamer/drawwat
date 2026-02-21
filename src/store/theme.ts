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
    const saved = localStorage.getItem('drawwat-theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialTheme = saved ? (saved as Theme) : (prefersDark ? 'dark' : 'light')
    setTheme(initialTheme)
  }

  watch(theme, (t) => {
    localStorage.setItem('drawwat-theme', t)
  })

  return {
    theme,
    isDark,
    setTheme,
    toggleTheme,
    initTheme
  }
}, {
  persist: {
    key: 'drawwat-theme',
    pick: ['theme']
  }
})
