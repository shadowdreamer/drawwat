<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'

const router = useRouter()
const authStore = useAuthStore()

function handleLogin() {
  authStore.toAuthPage('github')
}

function handleLogout() {
  authStore.logout()
  router.push('/')
}
</script>

<template>
  <!-- Not logged in - show login button -->
  <button
    v-if="!authStore.isLoggedIn"
    @click="handleLogin"
    class="btn btn-ghost btn-sm md:btn-md gap-2"
  >
    <i class="i-mdi-github" />
    <span class="hidden sm:inline">登录</span>
  </button>

  <!-- Logged in - show user dropdown -->
  <div v-else class="dropdown dropdown-end">
    <label tabindex="0" class="btn btn-ghost btn-sm md:btn-md gap-2">
      <div class="avatar">
        <div class="w-6 h-6 md:w-8 md:h-8 rounded-full">
          <img
            v-if="authStore.user?.avatar_url"
            :src="authStore.user.avatar_url"
            :alt="authStore.user.username"
          />
          <div v-else class="w-full h-full bg-primary text-primary-content flex items-center justify-center text-xs font-bold">
            {{ authStore.user?.username?.[0]?.toUpperCase() || '?' }}
          </div>
        </div>
      </div>
      <span class="hidden md:inline">{{ authStore.user?.username }}</span>
      <i class="i-mdi-chevron-down text-sm" />
    </label>
    <ul
      tabindex="0"
      class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
    >
      <li>
        <a class="flex items-center gap-2 opacity-50 cursor-default">
          <i class="i-mdi-account" />
          <div class="flex flex-col">
            <span class="text-sm font-semibold">{{ authStore.user?.username }}</span>
            <span class="text-xs">{{ authStore.user?.email || '' }}</span>
          </div>
        </a>
      </li>
      <div class="divider my-0"></div>
      <li><RouterLink to="/my-puzzles"><i class="i-mdi-gamepad-variant" />我的谜题</RouterLink></li>
      <li><a @click="handleLogout" class="text-error"><i class="i-mdi-logout" />退出登录</a></li>
    </ul>
  </div>
</template>
