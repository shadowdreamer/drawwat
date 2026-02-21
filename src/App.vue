<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import NavBar from './components/NavBar.vue'
import { useThemeStore } from './store/theme'

const themeStore = useThemeStore()

onMounted(() => {
  themeStore.initTheme()
})
</script>

<template>
  <div class="min-h-screen bg-base-200">
    <NavBar />
    <main class="min-h-screen">
      <RouterView />
    </main>
  </div>
</template>
