<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import { createBangumiIdResolver, type BangumiIdResolver } from '../utils/bangumi'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const puzzleId = computed(() => route.params.id as string)
const stats = ref<any>(null)
const loading = ref(true)
const error = ref('')

// Create resolver map for bangumi users
const resolverMap = ref<Map<string, BangumiIdResolver>>(new Map())

function getResolver(username: string, provider: string): BangumiIdResolver | null {
  if (provider !== 'bangumi') return null

  if (!resolverMap.value.has(username)) {
    resolverMap.value.set(username, createBangumiIdResolver(username))
  }
  return resolverMap.value.get(username)!
}

// Format date
function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Format time
function formatTime(seconds: number) {
  if (seconds < 60) return `${seconds}秒`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`
  return `${Math.floor(seconds / 3600)}小时`
}

// Load stats
async function loadStats() {
  loading.value = true
  error.value = ''

  try {
    const response = await fetch(`/api/puzzles/${puzzleId.value}/stats`, {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('只能查看自己创建的谜题统计')
      }
      throw new Error('加载失败')
    }

    const data = await response.json()
    stats.value = data
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadStats()
})
</script>

<template>
  <div class="content-page page-width">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-10">
      <button class="btn btn-ghost btn-sm btn-circle" aria-label="返回上一页" @click="router.back()">
        <i class="i-lucide-arrow-left" />
      </button>
      <div><span class="eyebrow">THE AHA MOMENTS</span><h1 class="text-2xl sm:text-3xl font-bold font-display mt-2 mb-0">那些猜中的瞬间。</h1></div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center min-h-[50vh]">
      <div class="text-center">
        <div class="loading loading-spinner loading-lg mb-6"></div>
        <p class="text-base-content/60">加载中...</p>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-error">
      <i class="i-lucide-alert-circle" />
      <span>{{ error }}</span>
    </div>

    <!-- Stats content -->
    <div v-else-if="stats">
      <!-- Overview cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div class="card bg-base-100">
          <div class="card-body p-8 text-center">
            <div class="text-sm text-base-content/60 mb-3">总猜测次数</div>
            <div class="text-4xl font-bold text-primary mb-2">{{ stats.total_guesses }}</div>
            <div class="text-xs text-base-content/50">不含过期后猜测</div>
          </div>
        </div>
        <div class="card bg-base-100">
          <div class="card-body p-8 text-center">
            <div class="text-sm text-base-content/60 mb-3">正确次数</div>
            <div class="text-4xl font-bold text-success mb-2">{{ stats.correct_guesses }}</div>
            <div class="text-xs text-base-content/50">正确率 {{ (stats.accuracy_rate * 100).toFixed(1) }}%</div>
          </div>
        </div>
        <div class="card bg-base-100">
          <div class="card-body p-8 text-center">
            <div class="text-sm text-base-content/60 mb-3">状态</div>
            <div
              class="text-3xl font-bold mb-2"
              :class="stats.is_expired ? 'text-warning' : 'text-success'"
            >
              {{ stats.is_expired ? '已过期' : '进行中' }}
            </div>
            <div class="text-xs text-base-content/50">答案: {{ stats.answer }}</div>
          </div>
        </div>
      </div>

      <!-- Leaderboard -->
      <div v-if="stats.solves && stats.solves.length > 0" class="card bg-base-100">
        <div class="card-body p-0">
          <div class="px-8 pt-8 pb-6 border-b border-base-300">
            <h2 class="card-title text-lg">成功排行榜</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th class="py-4">排名</th>
                  <th class="py-4">用户</th>
                  <th class="hidden sm:table-cell py-4">猜对时间</th>
                  <th class="py-4">用时</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(entry, index) in stats.solves" :key="index">
                  <td>
                    <span v-if="index === 0" class="text-xl">🥇</span>
                    <span v-else-if="index === 1" class="text-xl">🥈</span>
                    <span v-else-if="index === 2" class="text-xl">🥉</span>
                    <span v-else class="badge badge-ghost text-sm">#{{ +index + 1 }}</span>
                  </td>
                  <td>
                    <div class="flex items-center gap-3">
                      <div class="avatar placeholder">
                        <div class="bg-neutral text-neutral-content rounded-full w-8 h-8">
                          <img
                            v-if="entry.avatar_url"
                            :src="entry.avatar_url"
                            :alt="entry.username"
                          />
                          <span v-else class="text-xs font-semibold">
                            {{ getResolver(entry.username, entry.provider)?.nickname?.[0]?.toUpperCase() || entry.username?.[0]?.toUpperCase() || '?' }}
                          </span>
                        </div>
                      </div>
                      <span class="font-semibold">
                        {{ getResolver(entry.username, entry.provider)?.isResolved ? getResolver(entry.username, entry.provider)?.nickname : entry.username }}
                      </span>
                    </div>
                  </td>
                  <td class="hidden sm:table-cell text-sm opacity-70">{{ formatDate(entry.solved_at) }}</td>
                  <td>{{ formatTime(entry.time_to_solve) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div v-else class="alert alert-ghost">
        <i class="i-lucide-info" />
        <span>还没有人猜出这个谜题</span>
      </div>
    </div>
  </div>
</template>
