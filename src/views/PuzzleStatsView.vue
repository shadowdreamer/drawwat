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
    <div class="flex items-center gap-2 mb-6">
      <button class="btn btn-ghost btn-sm" @click="router.back()">
        <i class="i-mdi-arrow-left" />
      </button>
      <h1 class="text-3xl font-bold">谜题统计</h1>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center min-h-[50vh]">
      <div class="text-center">
        <div class="loading loading-spinner loading-lg mb-4"></div>
        <p>加载中...</p>
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
        <div class="stat bg-base-100 rounded-box shadow-lg">
          <div class="stat-title">总猜测次数</div>
          <div class="stat-value text-primary">{{ stats.total_guesses }}</div>
          <div class="stat-desc">不含过期后猜测</div>
        </div>
        <div class="stat bg-base-100 rounded-box shadow-lg">
          <div class="stat-title">正确次数</div>
          <div class="stat-value text-success">{{ stats.correct_guesses }}</div>
          <div class="stat-desc">正确率 {{ (stats.accuracy_rate * 100).toFixed(1) }}%</div>
        </div>
        <div class="stat bg-base-100 rounded-box shadow-lg">
          <div class="stat-title">状态</div>
          <div class="stat-value" :class="stats.is_expired ? 'text-warning' : 'text-success'">
            {{ stats.is_expired ? '已过期' : '进行中' }}
          </div>
          <div class="stat-desc">正确答案: {{ stats.answer }}</div>
        </div>
      </div>

      <!-- Leaderboard -->
      <div v-if="stats.solves && stats.solves.length > 0" class="card bg-base-100 shadow-lg mb-6">
        <div class="card-body">
          <h2 class="card-title">
            <i class="i-mdi-trophy" />
            成功排行榜
          </h2>
          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th>排名</th>
                  <th>用户</th>
                  <th>猜对时间</th>
                  <th>用时</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(entry, index) in stats.solves" :key="index">
                  <td>
                    <span v-if="index === 0" class="text-2xl">🥇</span>
                    <span v-else-if="index === 1" class="text-2xl">🥈</span>
                    <span v-else-if="index === 2" class="text-2xl">🥉</span>
                    <span v-else class="badge badge-ghost">#{{ index + 1 }}</span>
                  </td>
                  <td class="font-semibold">{{ entry.username }}</td>
                  <td>{{ formatDate(entry.solved_at) }}</td>
                  <td>{{ formatTime(entry.time_to_solve) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div v-else class="alert alert-ghost mb-6">
        <i class="i-mdi-information" />
        <span>还没有人猜出这个谜题</span>
      </div>
    </div>
  </div>
</template>
