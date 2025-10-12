<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="min-h-screen bg-base-200">
    <!-- Navigation -->
    <div class="navbar bg-base-100">
      <div class="flex-1">
        <a class="btn btn-ghost text-xl">CF Worker Template</a>
      </div>
      <div class="flex-none">
        <ul class="menu menu-horizontal px-1">
          <li><RouterLink to="/">Home</RouterLink></li>
          <li><RouterLink to="/about">About</RouterLink></li>
        </ul>
      </div>
    </div>
    
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
