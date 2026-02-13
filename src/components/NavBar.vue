<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../store/auth'
import LoginButton from './LoginButton.vue'

const authStore = useAuthStore()
</script>

<template>
  <div class="navbar bg-base-100 shadow-sm">
    <div class="flex-1">
      <RouterLink to="/" class="btn btn-ghost text-xl gap-2">
        <i class="i-mdi-puzzle" />
        DrawWat
      </RouterLink>
    </div>

    <div class="flex-none gap-2">
      <!-- Authenticated user links -->
      <template v-if="authStore.isLoggedIn">
        <RouterLink to="/create" class="btn btn-primary btn-sm md:btn-md gap-2">
          <i class="i-mdi-plus" />
          <span class="hidden sm:inline">创建谜题</span>
        </RouterLink>
        <RouterLink to="/my-puzzles" class="btn btn-ghost btn-sm md:btn-md gap-2">
          <i class="i-mdi-gamepad-variant" />
          <span class="hidden sm:inline">我的谜题</span>
        </RouterLink>
      </template>

      <!-- Login button / User dropdown -->
      <LoginButton />
    </div>
  </div>
</template>
