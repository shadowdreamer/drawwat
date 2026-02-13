<script setup lang="ts">
import { RouterView } from 'vue-router'
import NavBar from './components/NavBar.vue'
</script>

<template>
  <div class="min-h-screen bg-base-200">
    <NavBar />
    <main>
      <RouterView />
    </main>
  </div>
</template>
