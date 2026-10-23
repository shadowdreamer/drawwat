<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../store/auth'
import { useThemeStore } from '../store/theme'
import LoginButton from './LoginButton.vue'
const authStore = useAuthStore()
const themeStore = useThemeStore()
</script>

<template>
  <header class="site-header">
    <nav class="site-nav page-width" aria-label="主导航">
      <RouterLink to="/" class="brand" aria-label="DrawWat 首页">
        <span class="brand-symbol"><svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M9 5c5-3 13 1 13 6 0 4-8 3-9 7-1 3 6 5 10 1M8 9c-4 6-3 15 4 17 6 2 14-3 14-9" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/></svg></span>
        <span>DrawWat<span class="brand-dot">.</span></span>
      </RouterLink>
      <div class="nav-links">
        <RouterLink to="/" exact-active-class="nav-active" class="nav-link">首页</RouterLink>
        <RouterLink to="/plaza" active-class="nav-active" class="nav-link"><i class="i-lucide-compass" /> 谜题广场</RouterLink>
        <RouterLink v-if="authStore.isLoggedIn" to="/my-puzzles" active-class="nav-active" class="nav-link">我的谜题</RouterLink>
        <a v-else href="/#how-it-works" class="nav-link how-link">怎么玩</a>
      </div>
      <div class="nav-actions">
        <button class="theme-button" @click="themeStore.toggleTheme()" :title="themeStore.isDark ? '切换到亮色模式' : '切换到暗色模式'" :aria-label="themeStore.isDark ? '切换到亮色模式' : '切换到暗色模式'"><i :class="themeStore.isDark ? 'i-lucide-sun' : 'i-lucide-moon'" /></button>
        <RouterLink v-if="authStore.isLoggedIn" to="/create" class="btn btn-primary nav-create"><i class="i-lucide-plus" /><span>画一个</span></RouterLink>
        <LoginButton />
      </div>
    </nav>
  </header>
</template>
