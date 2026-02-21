<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getR2ImageUrl } from '../constants'
import { createBangumiIdResolver, type BangumiIdResolver } from '../utils/bangumi'

const router = useRouter()

const puzzles = ref<any[]>([])
const loading = ref(true)
const error = ref('')

// Pagination
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const totalPages = ref(0)

// Displayed page numbers with ellipsis
const displayedPages = computed(() => {
  const pages: (number | string)[] = []
  const delta = 1 // Number of pages to show on each side of current page

  for (let i = 1; i <= totalPages.value; i++) {
    if (
      i === 1 ||
      i === totalPages.value ||
      (i >= currentPage.value - delta && i <= currentPage.value + delta)
    ) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  return pages
})

// Create resolver map for bangumi users
const resolverMap = ref<Map<string, BangumiIdResolver>>(new Map())

function getResolver(username: string): BangumiIdResolver | null {
  if (!resolverMap.value.has(username)) {
    resolverMap.value.set(username, createBangumiIdResolver(username))
  }
  return resolverMap.value.get(username)!
}

// Format date
function formatDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  return date.toLocaleDateString('zh-CN')
}

// Load public puzzles
async function loadPublicPuzzles(page: number = currentPage.value) {
  loading.value = true
  error.value = ''

  try {
    const response = await fetch(`/api/public-puzzles?page=${page}&pageSize=${pageSize.value}`)

    if (!response.ok) {
      throw new Error('加载失败')
    }

    const data = await response.json()
    puzzles.value = data.puzzles || []
    total.value = data.total || 0
    totalPages.value = data.totalPages || 0
    currentPage.value = data.page || 1
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : '加载失败'
  } finally {
    loading.value = false
  }
}

// Change page
function goToPage(page: number) {
  if (page < 1 || page > totalPages.value) return
  loadPublicPuzzles(page)
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// View puzzle
function viewPuzzle(puzzleId: string) {
  router.push(`/puzzle/${puzzleId}`)
}

onMounted(() => {
  loadPublicPuzzles()
})
</script>

<template>
  <div class="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold font-display">谜题广场</h1>
        <p class="text-base-content/60 mt-2">发现并挑战有趣的谜题</p>
      </div>
      <div v-if="total > 0" class="text-sm text-base-content/60">
        共 {{ total }} 个谜题
      </div>
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

    <!-- Empty state -->
    <div v-else-if="puzzles.length === 0" class="text-center py-24">
      <div class="w-20 h-20 rounded-full bg-base-300/30 flex items-center justify-center mx-auto mb-8">
        <i class="i-lucide-globe text-4xl text-base-content/30" />
      </div>
      <h2 class="text-2xl font-bold mb-3 font-display">暂无公开谜题</h2>
      <p class="text-base-content/60 mb-8">快来创建第一个公开谜题吧！</p>
      <button class="btn btn-primary btn-lg gap-2" @click="router.push('/create')">
        <i class="i-lucide-plus" />
        创建谜题
      </button>
    </div>

    <!-- Puzzle Grid - Compact layout -->
    <div v-else>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div
          v-for="puzzle in puzzles"
          :key="puzzle.id"
          class="group card bg-base-100 hover:shadow-lg transition-all cursor-pointer border border-base-300 hover:border-primary/30"
          @click="viewPuzzle(puzzle.id)"
        >
          <figure class="relative aspect-square">
            <img
              :src="getR2ImageUrl(puzzle.image_url)"
              class="w-full h-full object-cover"
              :alt="puzzle.creator.username"
            />
            <!-- Overlay on hover -->
            <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div class="text-white text-center">
                <i class="i-lucide-play text-3xl" />
                <p class="text-sm mt-2">开始挑战</p>
              </div>
            </div>
          </figure>
          <div class="p-3">
            <!-- Creator info -->
            <div class="flex items-center gap-2 mb-2">
              <div class="avatar placeholder">
                <div class="bg-neutral text-neutral-content rounded-full w-5 h-5">
                  <img
                    v-if="puzzle.creator.avatar_url"
                    :src="puzzle.creator.avatar_url"
                    :alt="puzzle.creator.username"
                  />
                  <span v-else class="text-xs font-semibold">
                    {{ getResolver(puzzle.creator.username)?.nickname?.[0]?.toUpperCase() || puzzle.creator.username?.[0]?.toUpperCase() || '?' }}
                  </span>
                </div>
              </div>
              <span class="text-xs text-base-content/70 truncate">
                {{ getResolver(puzzle.creator.username)?.isResolved ? getResolver(puzzle.creator.username)?.nickname : puzzle.creator.username }}
              </span>
            </div>

            <!-- Stats -->
            <div class="flex items-center gap-3 text-xs text-base-content/50">
              <span class="flex items-center gap-1">
                <i class="i-lucide-users" />
                {{ puzzle.solves_count }}
              </span>
              <span class="flex items-center gap-1">
                <i class="i-lucide-message-square" />
                {{ puzzle.guesses_count }}
              </span>
              <span class="ml-auto">{{ formatDate(puzzle.created_at) }}</span>
            </div>

            <!-- Badges -->
            <div class="flex gap-1 mt-2">
              <span v-if="puzzle.hint" class="badge badge-warning badge-xs" title="有提示">
                <i class="i-lucide-lightbulb" />
              </span>
              <span v-if="!puzzle.expires_at" class="badge badge-ghost badge-xs" title="永久">
                <i class="i-lucide-infinity" />
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex justify-center mt-10">
        <div class="join">
          <button
            class="join-item btn btn-sm"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            <i class="i-lucide-chevron-left" />
          </button>

          <template v-for="page in displayedPages" :key="page">
            <button
              v-if="page !== '...'"
              class="join-item btn btn-sm"
              :class="page === currentPage ? 'btn-active' : ''"
              @click="goToPage(Number(page))"
            >
              {{ page }}
            </button>
            <button
              v-else
              class="join-item btn btn-sm btn-disabled"
              disabled
            >
              ...
            </button>
          </template>

          <button
            class="join-item btn btn-sm"
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
          >
            <i class="i-lucide-chevron-right" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
