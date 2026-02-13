<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'

const router = useRouter()
const authStore = useAuthStore()

const puzzles = ref<any[]>([])
const loading = ref(true)
const error = ref('')

// Format date
function formatDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays} 天前`
  return date.toLocaleDateString('zh-CN')
}

// Load user's puzzles
async function loadMyPuzzles() {
  loading.value = true
  error.value = ''

  try {
    const response = await fetch('/api/user/me/puzzles', {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })

    if (!response.ok) {
      throw new Error('加载失败')
    }

    const data = await response.json()
    puzzles.value = data.puzzles || []
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : '加载失败'
  } finally {
    loading.value = false
  }
}

// View puzzle
function viewPuzzle(puzzleId: string) {
  router.push(`/puzzle/${puzzleId}`)
}

// View stats
function viewStats(puzzleId: string) {
  router.push(`/puzzle/${puzzleId}/stats`)
}

onMounted(() => {
  loadMyPuzzles()
})
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-6xl">
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold">我的谜题</h1>
      <button class="btn btn-primary gap-2" @click="router.push('/create')">
        <i class="i-mdi-plus" />
        创建新谜题
      </button>
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

    <!-- Empty state -->
    <div v-else-if="puzzles.length === 0" class="text-center py-16">
      <i class="i-mdi-puzzle text-6xl text-base-content/30 mb-4" />
      <h2 class="text-2xl font-bold mb-2">还没有谜题</h2>
      <p class="text-base-content/60 mb-6">创建你的第一个谜题吧！</p>
      <button class="btn btn-primary btn-lg gap-2" @click="router.push('/create')">
        <i class="i-mdi-plus" />
        创建谜题
      </button>
    </div>

    <!-- Puzzle list -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="puzzle in puzzles"
        :key="puzzle.id"
        class="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow"
      >
        <figure class="px-4 pt-4">
          <img :src="puzzle.image_url" class="rounded-xl h-48 w-full object-cover" />
        </figure>
        <div class="card-body">
          <div class="flex items-center justify-between text-sm text-base-content/60 mb-2">
            <span>{{ formatDate(puzzle.created_at) }}</span>
            <span v-if="puzzle.expires_at" class="badge badge-ghost">限时</span>
            <span v-else class="badge badge-ghost">永久</span>
          </div>

          <div class="stats stats-vertical bg-base-200 rounded-box p-2 mb-2">
            <div class="stat px-2 py-1">
              <div class="stat-title text-xs">猜测</div>
              <div class="stat-value text-lg">{{ puzzle.total_guesses || 0 }}</div>
            </div>
            <div class="stat px-2 py-1">
              <div class="stat-title text-xs">正确</div>
              <div class="stat-value text-lg text-success">{{ puzzle.correct_guesses || 0 }}</div>
            </div>
          </div>

          <div class="card-actions justify-end mt-2">
            <button class="btn btn-ghost btn-sm" @click="viewPuzzle(puzzle.id)">
              <i class="i-mdi-eye" />
              查看
            </button>
            <button class="btn btn-primary btn-sm" @click="viewStats(puzzle.id)">
              <i class="i-mdi-chart-bar" />
              统计
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
