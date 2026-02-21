<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { createBangumiIdResolver, type BangumiIdResolver } from '../utils/bangumi'

interface GaveUpUser {
  user_id: string
  username: string
  provider: string
  avatar_url: string
  gave_up_at: string
}

const props = defineProps<{
  puzzleId: string
}>()

const gaveUpUsers = ref<GaveUpUser[]>([])
const loading = ref(true)
const isExpanded = ref(false)
const hasLoaded = ref(false)

// Resolver map for bangumi users
const resolverMap = ref<Map<string, BangumiIdResolver>>(new Map())

function getResolver(username: string): BangumiIdResolver | null {
  if (!resolverMap.value.has(username)) {
    resolverMap.value.set(username, createBangumiIdResolver(username))
  }
  return resolverMap.value.get(username)!
}

async function loadGaveUpUsers() {
  loading.value = true

  try {
    const response = await fetch(`/api/puzzles/${props.puzzleId}/gave-up`)
    if (response.ok) {
      const data = await response.json()
      gaveUpUsers.value = data.gave_up_users || []
    }
  } catch (err) {
    console.error('Failed to load gave up users:', err)
  } finally {
    loading.value = false
    hasLoaded.value = true
  }
}

function toggle() {
  isExpanded.value = !isExpanded.value
}

onMounted(() => {
  loadGaveUpUsers()
})
</script>

<template>
  <div class="card bg-base-100">
    <div class="card-body p-0">
      <!-- Collapsed state: clickable header -->
      <div
        v-if="!isExpanded"
        class="px-4 py-3 border-b border-base-300 bg-base-200/50 cursor-pointer hover:bg-base-300/50 transition-colors flex items-center justify-between"
        @click="toggle"
      >
        <div class="flex items-center gap-2">
          <h3 class="card-title text-sm">放弃用户</h3>
          <span v-if="hasLoaded && gaveUpUsers.length > 0" class="badge badge-warning badge-xs">
            {{ gaveUpUsers.length }}
          </span>
        </div>
        <i class="i-lucide-chevron-down text-base-content/60" />
      </div>

      <!-- Expanded state -->
      <div v-else>
        <div
          class="px-4 py-3 border-b border-base-300 bg-base-200/50 cursor-pointer hover:bg-base-300/50 transition-colors flex items-center justify-between"
          @click="toggle"
        >
          <div class="flex items-center gap-2">
            <h3 class="card-title text-sm">放弃用户</h3>
            <span v-if="hasLoaded && gaveUpUsers.length > 0" class="badge badge-warning badge-xs">
              {{ gaveUpUsers.length }}
            </span>
          </div>
          <i class="i-lucide-chevron-up text-base-content/60" />
        </div>

        <!-- Loading -->
        <div v-if="loading" class="p-6 text-center">
          <div class="loading loading-spinner loading-sm"></div>
        </div>

        <!-- No gave up users -->
        <div v-else-if="gaveUpUsers.length === 0" class="p-6 text-center text-sm text-base-content/60">
          <i class="i-lucide-user-check text-success mb-2" />
          <p>还没有人放弃</p>
        </div>

        <!-- Gave up users list -->
        <div v-else class="p-4">
          <div class="flex flex-col gap-2">
            <div
              v-for="user in gaveUpUsers"
              :key="user.user_id"
              class="flex items-center gap-2 p-2 rounded-lg bg-base-200"
            >
              <div class="avatar placeholder">
                <div class="bg-neutral text-neutral-content rounded-full w-6 h-6">
                  <img
                    v-if="user.avatar_url"
                    :src="user.avatar_url"
                    :alt="user.username"
                  />
                  <span v-else class="text-xs font-semibold">
                    {{ getResolver(user.username)?.nickname?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || '?' }}
                  </span>
                </div>
              </div>
              <span class="text-sm flex-1 truncate">
                {{ getResolver(user.username)?.isResolved ? getResolver(user.username)?.nickname : user.username }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
