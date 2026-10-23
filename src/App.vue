<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import NavBar from './components/NavBar.vue'
import { useThemeStore } from './store/theme'
const themeStore = useThemeStore()
onMounted(() => themeStore.initTheme())
</script>

<template>
  <div class="app-shell">
    <a href="#main-content" class="skip-link">跳到主要内容</a>
    <div class="ambient-light" aria-hidden="true"><span /><span /><span /></div>
    <NavBar />
    <main id="main-content" tabindex="-1"><RouterView /></main>
  </div>
</template>
