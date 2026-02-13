<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const puzzleId = computed(() => route.params.id as string)
const stats = ref<any>(null)
const loading = ref(true)
const error = ref('')

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
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <!-- Header -->
    <div class="flex items-center gap-2 mb-6">
      <button class="btn btn-ghost btn-sm btn-circle" @click="router.back()">
        <i class="i-mdi-arrow-left" />
      </button>
      <h1 class="text-2xl sm:text-3xl font-bold font-display">谜题统计</h1>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center min-h-[50vh]">
      <div class="text-center">
        <div class="loading loading-spinner loading-lg mb-4"></div>
        <p class="text-base-content/60">加载中...</p>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-error">
      <i class="i-mdi-alert-circle" />
      <span>{{ error }}</span>
    </div>

    <!-- Stats content -->
    <div v-else-if="stats">
      <!-- Overview cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div class="card bg-base-100">
          <div class="card-body p-6 text-center">
            <div class="text-sm text-base-content/60 mb-2">总猜测次数</div>
            <div class="text-3xl font-bold text-primary mb-1">{{ stats.total_guesses }}</div>
            <div class="text-xs text-base-content/50">不含过期后猜测</div>
          </div>
        </div>
        <div class="card bg-base-100">
          <div class="card-body p-6 text-center">
            <div class="text-sm text-base-content/60 mb-2">正确次数</div>
            <div class="text-3xl font-bold text-success mb-1">{{ stats.correct_guesses }}</div>
            <div class="text-xs text-base-content/50">正确率 {{ (stats.accuracy_rate * 100).toFixed(1) }}%</div>
          </div>
        </div>
        <div class="card bg-base-100">
          <div class="card-body p-6 text-center">
            <div class="text-sm text-base-content/60 mb-2">状态</div>
            <div
              class="text-2xl font-bold mb-1"
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
          <div class="px-6 pt-6 pb-4">
            <h2 class="card-title text-lg">成功排行榜</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th>排名</th>
                  <th>用户</th>
                  <th class="hidden sm:table-cell">猜对时间</th>
                  <th>用时</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(entry, index) in stats.solves" :key="index">
                  <td>
                    <span v-if="index === 0" class="text-xl">🥇</span>
                    <span v-else-if="index === 1" class="text-xl">🥈</span>
                    <span v-else-if="index === 2" class="text-xl">🥉</span>
                    <span v-else class="badge badge-ghost text-sm">#{{ index + 1 }}</span>
                  </td>
                  <td class="font-semibold">{{ entry.username }}</td>
                  <td class="hidden sm:table-cell text-sm opacity-70">{{ formatDate(entry.solved_at) }}</td>
                  <td>{{ formatTime(entry.time_to_solve) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div v-else class="alert alert-ghost">
        <i class="i-mdi-information" />
        <span>还没有人猜出这个谜题</span>
      </div>
    </div>
  </div>
</template>
