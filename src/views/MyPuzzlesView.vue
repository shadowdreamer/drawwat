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
  <div class="container mx-auto px-6 py-12 max-w-6xl">
    <!-- Header -->
    <div class="flex items-center justify-between mb-10">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold font-display">我的谜题</h1>
        <p class="text-base-content/60 mt-2">管理你创建的所有谜题</p>
      </div>
      <button class="btn btn-primary gap-2" @click="router.push('/create')">
        <i class="i-mdi-plus" />
        <span class="hidden sm:inline">创建新谜题</span>
      </button>
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
      <i class="i-mdi-alert-circle" />
      <span>{{ error }}</span>
    </div>

    <!-- Empty state -->
    <div v-else-if="puzzles.length === 0" class="text-center py-24">
      <div class="w-20 h-20 rounded-full bg-base-300/30 flex items-center justify-center mx-auto mb-8">
        <i class="i-mdi-puzzle-outline text-4xl text-base-content/30" />
      </div>
      <h2 class="text-2xl font-bold mb-3 font-display">还没有谜题</h2>
      <p class="text-base-content/60 mb-8">创建你的第一个谜题吧！</p>
      <button class="btn btn-primary btn-lg gap-2" @click="router.push('/create')">
        <i class="i-mdi-plus" />
        创建谜题
      </button>
    </div>

    <!-- Puzzle list -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div
        v-for="puzzle in puzzles"
        :key="puzzle.id"
        class="card bg-base-100 hover:shadow-lg transition-shadow"
      >
        <figure class="px-5 pt-5">
          <img :src="puzzle.image_url" class="rounded-xl h-48 w-full object-cover" />
        </figure>
        <div class="card-body">
          <div class="flex items-center justify-between text-sm mb-4">
            <span class="text-base-content/60">{{ formatDate(puzzle.created_at) }}</span>
            <span v-if="puzzle.expires_at" class="badge badge-ghost text-xs">限时</span>
            <span v-else class="badge badge-ghost text-xs">永久</span>
          </div>

          <div class="flex gap-4 mb-6">
            <div class="flex-1 bg-base-200 rounded-lg p-4 text-center">
              <div class="text-2xl font-bold">{{ puzzle.total_guesses || 0 }}</div>
              <div class="text-xs text-base-content/60 mt-1">猜测</div>
            </div>
            <div class="flex-1 bg-base-200 rounded-lg p-4 text-center">
              <div class="text-2xl font-bold text-success">{{ puzzle.correct_guesses || 0 }}</div>
              <div class="text-xs text-base-content/60 mt-1">正确</div>
            </div>
          </div>

          <div class="card-actions justify-end gap-2 mt-2">
            <button class="btn btn-ghost btn-sm" @click="viewPuzzle(puzzle.id)">
              <i class="i-mdi-eye-outline" />
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
