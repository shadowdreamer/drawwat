<script setup lang="ts">
import { RouterView } from 'vue-router'
import NavBar from './components/NavBar.vue'
</script>

<template>
  <div class="min-h-screen bg-base-200">
    <!-- Navigation -->
    <NavBar />

    <!-- Main Content -->
    <main>
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.router-link-active {
  @apply text-primary font-semibold;
}
</style>
