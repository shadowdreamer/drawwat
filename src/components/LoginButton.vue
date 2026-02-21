<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import { createBangumiIdResolver, type BangumiIdResolver } from '../utils/bangumi'
import { computed } from 'vue'

const router = useRouter()
const authStore = useAuthStore()

// Create resolver for bangumi user nickname (username is bangumi id)
const bangumiResolver = computed<BangumiIdResolver | null>(() => {
  if (authStore.user?.provider === 'bangumi' && authStore.user?.username) {
    return createBangumiIdResolver(authStore.user.username)
  }
  return null
})

function handleLogin() {
  authStore.toAuthPage()
}

function handleLogout() {
  authStore.logout()
  router.push('/')
}
</script>

<template>
  <button
    v-if="!authStore.isLoggedIn"
    @click="handleLogin"
    class="btn btn-primary btn-sm gap-2"
  >
    <i class="i-lucide-log-in" />
    <span class="hidden sm:inline">登录</span>
  </button>

  <div v-else class="dropdown dropdown-end">
    <label
      tabindex="0"
      class="btn btn-ghost btn-sm gap-2 px-2"
    >
      <div class="avatar placeholder">
        <div class="bg-neutral text-neutral-content rounded-full w-8 h-8">
          <span v-if="!authStore.user?.avatar_url" class="text-xs font-semibold">
            {{ authStore.user?.username?.[0]?.toUpperCase() || '?' }}
          </span>
          <img
            v-else
            :src="authStore.user.avatar_url"
            :alt="authStore.user.username"
          />
        </div>
      </div>
      <span class="hidden md:inline">
        {{ bangumiResolver?.isResolved ? bangumiResolver.nickname : authStore.user?.username }}
      </span>
      <i class="i-lucide-chevron-down text-xs opacity-60" />
    </label>
    <ul
      tabindex="0"
      class="dropdown-content z-[1] menu menu-sm p-2 shadow-xl bg-base-100 rounded-box w-52 mt-2 border border-base-300"
      style="background-color: hsl(var(--b1));"
    >
      <li class="menu-title opacity-60">
        {{ bangumiResolver?.isResolved ? bangumiResolver.nickname : authStore.user?.username }}
      </li>
      <li><RouterLink to="/my-puzzles"><i class="i-lucide-gamepad-2" />我的谜题</RouterLink></li>
      <li><a @click="handleLogout" class="text-error"><i class="i-lucide-log-out" />退出登录</a></li>
    </ul>
  </div>
</template>
