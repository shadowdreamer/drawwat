<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../store/auth'
import { getR2ImageUrl } from '../constants'
import { createBangumiIdResolver, type BangumiIdResolver } from '../utils/bangumi'

const route = useRoute()
const authStore = useAuthStore()

// Puzzle data
const puzzle = ref<any>(null)
const loading = ref(true)
const error = ref('')

// Creator resolver
const creatorResolver = computed<BangumiIdResolver | null>(() => {
  if (puzzle.value?.creator?.username) {
    return getResolver(puzzle.value.creator.username)
  }
  return null
})

// Guess state
const guess = ref('')
const submitting = ref(false)
const guessResult = ref<any>(null)
const guesses = ref<any[]>([])
const leaderboard = ref<any[]>([])

// Show answer state
const showAnswer = ref(false)
const correctAnswer = ref('')

// Create resolver map for bangumi users
const resolverMap = ref<Map<string, BangumiIdResolver>>(new Map())

function getResolver(username: string): BangumiIdResolver | null {
  if (!resolverMap.value.has(username)) {
    resolverMap.value.set(username, createBangumiIdResolver(username))
  }
  return resolverMap.value.get(username)!
}

// Computed
const puzzleId = computed(() => route.params.id as string)
const isExpired = computed(() => puzzle.value?.is_expired)
const hasSolved = computed(() => {
  return guesses.value.some((g: any) => g.is_correct)
})

// Check if current user is the creator
const isCreator = computed(() => {
  return authStore.user?.id === puzzle.value?.creator?.id
})

// Check if user can guess (not creator and not solved)
const canGuess = computed(() => {
  return !isCreator.value && !hasSolved.value
})

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

// Load puzzle data
async function loadPuzzle() {
  loading.value = true
  error.value = ''

  try {
    const [puzzleRes, guessesRes, solvesRes] = await Promise.all([
      fetch(`/api/puzzles/${puzzleId.value}`),
      fetch(`/api/puzzles/${puzzleId.value}/guesses`, {
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      }),
      fetch(`/api/puzzles/${puzzleId.value}/solves`)
    ])

    if (!puzzleRes.ok) {
      throw new Error('谜题不存在')
    }

    const puzzleData = await puzzleRes.json()
    puzzle.value = puzzleData

    if (guessesRes.ok) {
      const guessesData = await guessesRes.json()
      guesses.value = guessesData.guesses || []
    } else if (guessesRes.status === 401) {
      // Not authenticated, ignore guesses
      guesses.value = []
    }

    if (solvesRes.ok) {
      const solvesData = await solvesRes.json()
      leaderboard.value = solvesData.solves || []
    }
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : '加载失败'
  } finally {
    loading.value = false
  }
}

// Submit guess
async function submitGuess() {
  const trimmedGuess = guess.value.trim()
  if (!trimmedGuess || submitting.value) return

  submitting.value = true
  guessResult.value = null

  try {
    const response = await fetch(`/api/puzzles/${puzzleId.value}/guess`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({ answer: trimmedGuess })
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || '提交失败')
    }

    const result = await response.json()
    guessResult.value = result

    guesses.value.unshift({
      guess_answer: trimmedGuess,
      is_correct: result.is_correct,
      correct_chars: result.hint?.correct_chars,
      correct_positions: result.hint?.correct_positions,
      is_after_expiry: result.is_expired,
      guessed_at: new Date().toISOString()
    })

    guess.value = ''

    if (result.is_correct) {
      loadPuzzle()
    }
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : '提交失败'
  } finally {
    submitting.value = false
  }
}

// Show answer (expired puzzles only)
async function revealAnswer() {
  try {
    const response = await fetch(`/api/puzzles/${puzzleId.value}/answer`, {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || '获取答案失败')
    }

    const data = await response.json()
    correctAnswer.value = data.answer
    showAnswer.value = true
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : '获取答案失败'
  }
}

// Handle enter key
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    submitGuess()
  }
}

onMounted(() => {
  loadPuzzle()
})
</script>

<template>
  <div class="min-h-screen bg-base-200">
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center h-[calc(100vh-4rem)]">
      <div class="text-center">
        <div class="loading loading-spinner loading-lg mb-6"></div>
        <p class="text-base-content/60">加载谜题...</p>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="flex items-center justify-center h-[calc(100vh-4rem)]">
      <div class="alert alert-error max-w-md">
        <i class="i-lucide-alert-circle" />
        <span>{{ error }}</span>
      </div>
    </div>

    <!-- Puzzle Content -->
    <div v-if="puzzle">
      <!-- Desktop: Side by Side Layout -->
      <div class="hidden lg:flex h-[calc(100vh-4rem)]">
      <!-- Left: Image Area -->
      <div class="flex-1 flex flex-col bg-base-300/30">
        <!-- Image Header -->
        <div class="flex items-center justify-between px-6 py-3 bg-base-100/80 backdrop-blur-sm border-b border-base-300 shrink-0 gap-4">
          <div class="flex items-center gap-2">
            <i class="i-lucide-image text-primary" />
            <h1 class="font-semibold">谜题图片</h1>
          </div>

          <!-- Creator Card -->
          <a
            v-if="puzzle.creator"
            :href="`https://bgm.tv/user/${puzzle.creator.bangumi_id}`"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-base-200 hover:bg-base-300 transition-colors border border-base-300"
          >
            <img
              :src="puzzle.creator.avatar_url || '/default-avatar.png'"
              class="w-6 h-6 rounded-full object-cover"
              :alt="puzzle.creator.username"
            />
            <span class="text-sm font-medium">
              {{ creatorResolver?.isResolved ? creatorResolver?.nickname : puzzle.creator.username }}
            </span>
            <i class="i-lucide-external-link text-base-content/40 text-sm" />
          </a>

          <div v-if="isExpired" class="badge badge-warning badge-sm">
            已过期
          </div>
        </div>

        <!-- Image Container -->
        <div class="flex-1 min-h-0 flex items-center justify-center p-6">
          <div class="relative max-w-full max-h-full">
            <img
              :src="getR2ImageUrl(puzzle.image_url)"
              class="max-h-[calc(100vh-8rem)] w-auto object-contain rounded-xl shadow-lg"
              alt="谜题图片"
            />
          </div>
        </div>
      </div>

      <!-- Right: Guess Panel -->
      <div class="w-96 flex flex-col bg-base-100 border-l border-base-300 shadow-xl">
        <!-- Panel Header -->
        <div class="px-6 py-4 border-b border-base-300 shrink-0">
          <h2 class="text-lg font-bold font-display">猜测谜题</h2>
          <p class="text-sm text-base-content/60 mt-1">输入答案看看你是否猜对了</p>
        </div>

        <!-- Scrollable Content -->
        <div class="flex-1 overflow-y-auto">
          <!-- Hint -->
          <div v-if="puzzle.hint?.trim()" class="mx-4 mt-4">
            <div class="alert alert-info alert-sm py-2">
              <i class="i-lucide-lightbulb text-sm" />
              <span class="text-sm">{{ puzzle.hint }}</span>
            </div>
          </div>

          <!-- Success Alert -->
          <div v-if="hasSolved && !showAnswer" class="mx-4 mt-4">
            <div class="alert alert-success alert-sm py-2">
              <i class="i-lucide-trophy text-sm" />
              <span class="text-sm">恭喜你答对了！</span>
            </div>
          </div>

          <!-- Expired Alert -->
          <div v-if="isExpired && !showAnswer" class="mx-4 mt-4">
            <div class="alert alert-warning alert-sm py-2">
              <i class="i-lucide-alert-triangle text-sm" />
              <span class="text-sm flex-1">此谜题已过期</span>
              <button class="btn btn-xs btn-warning" @click="revealAnswer">
                查看答案
              </button>
            </div>
          </div>

          <!-- Answer Revealed -->
          <div v-if="showAnswer" class="mx-4 mt-4">
            <div class="alert alert-success alert-sm py-3">
              <i class="i-lucide-circle-check" />
              <div>
                <div class="text-sm font-semibold">正确答案是：</div>
                <div class="text-lg font-mono font-bold">{{ correctAnswer }}</div>
              </div>
            </div>
          </div>

          <!-- Guess Input -->
          <div v-if="canGuess && (!hasSolved || !showAnswer)" class="px-6 py-4 border-b border-base-300">
            <div class="form-control">
              <label class="label py-1">
                <span class="label-text font-medium">输入你的答案</span>
              </label>
              <input
                v-model="guess"
                type="text"
                class="input input-bordered input-sm text-center text-xl tracking-widest"
                placeholder="输入答案..."
                :disabled="submitting"
                @keydown="handleKeydown"
              />
            </div>
            <button
              class="btn btn-primary w-full mt-3 gap-2"
              :disabled="!guess.trim() || submitting"
              @click="submitGuess"
            >
              <span v-if="submitting" class="loading loading-spinner loading-sm"></span>
              <i class="i-lucide-send" />
              提交猜测
            </button>
          </div>

          <!-- Creator/Solved Message -->
          <div v-else-if="isCreator" class="px-6 py-4 border-b border-base-300 text-center">
            <p class="text-sm text-base-content/60">
              <i class="i-lucide-info mr-1" />
              这是你创建的题目，不能作答
            </p>
          </div>

          <div v-else-if="hasSolved" class="px-6 py-4 border-b border-base-300 text-center">
            <p class="text-sm text-success font-medium">
              <i class="i-lucide-circle-check mr-1" />
              你已经猜对了这个谜题！
            </p>
          </div>

          <!-- Last Guess Result -->
          <div v-if="guessResult && !guessResult.is_correct" class="px-4 py-4 border-b border-base-300">
            <p class="text-sm font-medium mb-3">{{ guessResult.message }}</p>
            <div class="flex gap-2 flex-wrap">
              <div class="badge badge-success gap-1">
                <i class="i-lucide-circle-check text-xs" />
                {{ guessResult.hint.correct_chars }} 字符正确
              </div>
              <div class="badge badge-info gap-1">
                <i class="i-lucide-target text-xs" />
                {{ guessResult.hint.correct_positions }} 位置正确
              </div>
            </div>
          </div>

          <!-- Guess History -->
          <div v-if="guesses.length > 0" class="border-b border-base-300">
            <div class="px-6 py-3 border-b border-base-300 bg-base-200/50">
              <h3 class="font-semibold text-sm">猜测历史 ({{ guesses.length }})</h3>
            </div>
            <div class="max-h-[50vh] overflow-y-auto">
              <table class="table table-zebra table-sm">
                <thead class="sticky top-0 bg-base-100">
                  <tr>
                    <th class="py-2 text-xs">猜测</th>
                    <th class="py-2 text-xs hidden sm:table-cell">时间</th>
                    <th class="py-2 text-xs">提示</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(g, idx) in guesses" :key="idx" :class="{ 'opacity-50': g.is_after_expiry }">
                    <td class="font-mono text-sm">{{ g.guess_answer }}</td>
                    <td class="text-xs opacity-70 hidden sm:table-cell">{{ formatDate(g.guessed_at) }}</td>
                    <td>
                      <div v-if="!g.is_correct" class="flex gap-1 flex-wrap">
                        <span v-if="g.correct_chars !== undefined" class="badge badge-success text-xs py-0">
                          {{ g.correct_chars }}
                        </span>
                        <span v-if="g.correct_positions !== undefined" class="badge badge-info text-xs py-0">
                          {{ g.correct_positions }}
                        </span>
                      </div>
                      <i v-else class="i-lucide-circle-check text-success text-sm"></i>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Leaderboard -->
          <div v-if="leaderboard.length > 0">
            <div class="px-6 py-3 border-b border-base-300 bg-base-200/50">
              <h3 class="font-semibold text-sm">成功排行榜</h3>
            </div>
            <div class="max-h-[50vh] overflow-y-auto">
              <table class="table table-zebra table-sm">
                <thead class="sticky top-0 bg-base-100">
                  <tr>
                    <th class="py-2 text-xs">排名</th>
                    <th class="py-2 text-xs">用户</th>
                    <th class="py-2 text-xs">用时</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(entry, index) in leaderboard" :key="entry.user_id">
                    <td>
                      <span v-if="index === 0">🥇</span>
                      <span v-else-if="index === 1">🥈</span>
                      <span v-else-if="index === 2">🥉</span>
                      <span v-else class="text-xs opacity-70">#{{ index + 1 }}</span>
                    </td>
                    <td>
                      <div class="flex items-center gap-2">
                        <div class="avatar placeholder">
                          <div class="bg-neutral text-neutral-content rounded-full w-6 h-6">
                            <img
                              v-if="entry.avatar_url"
                              :src="entry.avatar_url"
                              :alt="entry.username"
                            />
                            <span v-else class="text-xs font-semibold">
                              {{ getResolver(entry.username)?.nickname?.[0]?.toUpperCase() || entry.username?.[0]?.toUpperCase() || '?' }}
                            </span>
                          </div>
                        </div>
                        <span class="text-sm">
                          {{ getResolver(entry.username)?.isResolved ? getResolver(entry.username)?.nickname : entry.username }}
                        </span>
                      </div>
                    </td>
                    <td class="text-xs">{{ formatTime(entry.time_to_solve) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- No solves yet -->
          <div v-else-if="!hasSolved" class="px-6 py-8 text-center">
            <i class="i-lucide-info text-base-content/40 text-3xl mb-2" />
            <p class="text-sm text-base-content/60">还没有人猜出这个谜题</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile: Vertical Layout -->
    <div class="lg:hidden">
      <!-- Image Section -->
      <section class="bg-base-300/30">
        <div class="flex items-center justify-between px-4 py-3 bg-base-100/80 backdrop-blur-sm border-b border-base-300 gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <i class="i-lucide-image text-primary shrink-0" />
            <h1 class="font-semibold">谜题图片</h1>
          </div>

          <!-- Creator Card (Mobile) -->
          <a
            v-if="puzzle.creator"
            :href="`https://bgm.tv/user/${puzzle.creator.bangumi_id}`"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-base-200 hover:bg-base-300 transition-colors border border-base-300 min-w-0"
          >
            <img
              :src="puzzle.creator.avatar_url || '/default-avatar.png'"
              class="w-5 h-5 rounded-full object-cover shrink-0"
              :alt="puzzle.creator.username"
            />
            <span class="text-sm font-medium truncate">
              {{ creatorResolver?.isResolved ? creatorResolver?.nickname : puzzle.creator.username }}
            </span>
            <i class="i-lucide-external-link text-base-content/40 text-xs shrink-0" />
          </a>

          <div v-if="isExpired" class="badge badge-warning badge-sm shrink-0">
            已过期
          </div>
        </div>

        <div class="p-4">
          <img
            :src="getR2ImageUrl(puzzle.image_url)"
            class="w-full rounded-xl shadow-lg"
            alt="谜题图片"
          />
        </div>
        <div v-if="puzzle.hint?.trim()" class="px-4 pb-4">
          <div class="alert alert-info alert-sm py-2">
            <i class="i-lucide-lightbulb text-sm" />
            <span class="text-sm">{{ puzzle.hint }}</span>
          </div>
        </div>
      </section>

      <!-- Guess Section -->
      <section class="bg-base-100 border-t border-base-300">
        <div class="container mx-auto px-4 py-6 max-w-lg">
          <h2 class="text-lg font-bold font-display mb-4">猜测谜题</h2>

          <!-- Status Alerts -->
          <div v-if="hasSolved && !showAnswer" class="alert alert-success mb-4">
            <i class="i-lucide-trophy" />
            <span>恭喜你答对了！</span>
          </div>

          <div v-if="isExpired && !showAnswer" class="alert alert-warning mb-4">
            <i class="i-lucide-alert-triangle" />
            <div class="flex-1">
              <div class="text-sm">此谜题已过期，过期后的猜测不会计入统计</div>
            </div>
            <button class="btn btn-sm btn-warning" @click="revealAnswer">
              查看答案
            </button>
          </div>

          <div v-if="showAnswer" class="alert alert-success mb-4">
            <i class="i-lucide-circle-check" />
            <div>
              <h3 class="font-semibold">正确答案是：</h3>
              <div class="text-lg font-mono mt-1">{{ correctAnswer }}</div>
            </div>
          </div>

          <!-- Guess Input -->
          <div v-if="canGuess && (!hasSolved || !showAnswer)" class="mb-6">
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">输入你的答案</span>
              </label>
              <input
                v-model="guess"
                type="text"
                class="input input-bordered input-lg text-center text-2xl tracking-widest"
                placeholder="输入答案..."
                :disabled="submitting"
                @keydown="handleKeydown"
              />
            </div>
            <button
              class="btn btn-primary w-full mt-3 gap-2"
              :disabled="!guess.trim() || submitting"
              @click="submitGuess"
            >
              <span v-if="submitting" class="loading loading-spinner loading-sm"></span>
              <i class="i-lucide-send" />
              提交猜测
            </button>
          </div>

          <!-- Guess Result -->
          <div v-if="guessResult && !guessResult.is_correct" class="card bg-base-200 mb-6">
            <div class="card-body p-4">
              <p class="mb-4">{{ guessResult.message }}</p>
              <div class="flex gap-3 justify-center flex-wrap">
                <div class="badge badge-lg badge-success gap-2">
                  <i class="i-lucide-circle-check" />
                  {{ guessResult.hint.correct_chars }} 个字符正确
                </div>
                <div class="badge badge-lg badge-info gap-2">
                  <i class="i-lucide-target" />
                  {{ guessResult.hint.correct_positions }} 个位置正确
                </div>
              </div>
            </div>
          </div>

          <!-- Guess History -->
          <div v-if="guesses.length > 0" class="mb-6">
            <h3 class="font-semibold mb-3">猜测历史 ({{ guesses.length }})</h3>
            <div class="card bg-base-200">
              <div class="overflow-x-auto">
                <table class="table table-zebra table-sm">
                  <thead>
                    <tr>
                      <th class="py-3">猜测</th>
                      <th class="hidden sm:table-cell py-3">时间</th>
                      <th class="py-3">提示</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(g, idx) in guesses" :key="idx" :class="{ 'opacity-50': g.is_after_expiry }">
                      <td class="font-mono">{{ g.guess_answer }}</td>
                      <td class="hidden sm:table-cell text-sm opacity-70">{{ formatDate(g.guessed_at) }}</td>
                      <td>
                        <div v-if="!g.is_correct" class="flex gap-1 flex-wrap">
                          <span v-if="g.correct_chars !== undefined" class="badge badge-success text-xs">
                            {{ g.correct_chars }} 字符
                          </span>
                          <span v-if="g.correct_positions !== undefined" class="badge badge-info text-xs">
                            {{ g.correct_positions }} 位置
                          </span>
                        </div>
                        <i v-else class="i-lucide-circle-check text-success"></i>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Leaderboard -->
          <div v-if="leaderboard.length > 0">
            <h3 class="font-semibold mb-3">成功排行榜</h3>
            <div class="card bg-base-200">
              <div class="overflow-x-auto">
                <table class="table table-zebra">
                  <thead>
                    <tr>
                      <th class="py-3">排名</th>
                      <th class="py-3">用户</th>
                      <th class="py-3">用时</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(entry, index) in leaderboard" :key="entry.user_id">
                      <td>
                        <span v-if="index === 0" class="text-xl">🥇</span>
                        <span v-else-if="index === 1" class="text-xl">🥈</span>
                        <span v-else-if="index === 2" class="text-xl">🥉</span>
                        <span v-else class="badge badge-ghost text-sm">#{{ index + 1 }}</span>
                      </td>
                      <td>
                        <div class="flex items-center gap-2">
                          <div class="avatar placeholder">
                            <div class="bg-neutral text-neutral-content rounded-full w-6 h-6">
                              <img
                                v-if="entry.avatar_url"
                                :src="entry.avatar_url"
                                :alt="entry.username"
                              />
                              <span v-else class="text-xs font-semibold">
                                {{ getResolver(entry.username)?.nickname?.[0]?.toUpperCase() || entry.username?.[0]?.toUpperCase() || '?' }}
                              </span>
                            </div>
                          </div>
                          <span class="font-semibold">
                            {{ getResolver(entry.username)?.isResolved ? getResolver(entry.username)?.nickname : entry.username }}
                          </span>
                        </div>
                      </td>
                      <td>{{ formatTime(entry.time_to_solve) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div v-else-if="!hasSolved" class="alert alert-ghost text-center">
            <i class="i-lucide-info" />
            <span>还没有人猜出这个谜题</span>
          </div>
        </div>
      </section>
    </div>
    </div>
  </div>
</template>
