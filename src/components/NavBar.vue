<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../store/auth'
import { useThemeStore } from '../store/theme'
import LoginButton from './LoginButton.vue'

const authStore = useAuthStore()
const themeStore = useThemeStore()
</script>

<template>
  <nav class="navbar bg-base-100/95 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-6">
    <div class="flex-1">
      <RouterLink
        to="/"
        class="btn btn-ghost text-xl gap-2 font-display hover:bg-transparent"
      >
        <i class="i-lucide-puzzle" />
        <span>DrawWat</span>
      </RouterLink>
    </div>

    <div class="flex-none gap-2">
      <RouterLink to="/plaza" class="btn btn-ghost btn-sm gap-2">
        <i class="i-lucide-globe" />
        <span class="hidden sm:inline">广场</span>
      </RouterLink>

      <button
        @click="themeStore.toggleTheme()"
        class="btn btn-ghost btn-sm gap-2"
        :title="themeStore.isDark ? '切换到亮色模式' : '切换到暗色模式'"
      >
        <i class="i-lucide-sun" v-show="themeStore.isDark" />
        <i class="i-lucide-moon" v-show="!themeStore.isDark" />
      </button>

      <RouterLink
        v-if="authStore.isLoggedIn"
        to="/create"
        class="btn btn-ghost btn-sm gap-2"
      >
        <i class="i-lucide-plus" />
        <span class="hidden sm:inline">创建</span>
      </RouterLink>
      <RouterLink
        v-if="authStore.isLoggedIn"
        to="/my-puzzles"
        class="btn btn-ghost btn-sm gap-2"
      >
        <i class="i-lucide-gamepad-2" />
        <span class="hidden sm:inline">我的谜题</span>
      </RouterLink>

      <LoginButton />
    </div>
  </nav>
</template>
