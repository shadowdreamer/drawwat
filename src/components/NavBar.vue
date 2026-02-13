<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../store/auth'
import LoginButton from './LoginButton.vue'

const authStore = useAuthStore()
</script>

<template>
  <nav class="navbar bg-base-100/95 backdrop-blur-md sticky top-0 z-50">
    <div class="flex-1">
      <RouterLink
        to="/"
        class="btn btn-ghost text-xl gap-2 font-display hover:bg-transparent"
      >
        <i class="i-mdi-puzzle-outline" />
        <span>DrawWat</span>
      </RouterLink>
    </div>

    <div class="flex-none gap-1 sm:gap-2">
      <RouterLink
        v-if="authStore.isLoggedIn"
        to="/create"
        class="btn btn-ghost btn-sm gap-2"
      >
        <i class="i-mdi-plus" />
        <span class="hidden sm:inline">创建</span>
      </RouterLink>
      <RouterLink
        v-if="authStore.isLoggedIn"
        to="/my-puzzles"
        class="btn btn-ghost btn-sm gap-2"
      >
        <i class="i-mdi-gamepad-variant-outline" />
        <span class="hidden sm:inline">我的谜题</span>
      </RouterLink>

      <LoginButton />
    </div>
  </nav>
</template>
