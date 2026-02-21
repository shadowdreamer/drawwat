<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../store/auth'
import { getR2ImageUrl } from '../constants'

const route = useRoute()
const authStore = useAuthStore()

// Puzzle data
const puzzle = ref<any>(null)
const loading = ref(true)
const error = ref('')

// Guess state
const guess = ref('')
const submitting = ref(false)
const guessResult = ref<any>(null)
const guesses = ref<any[]>([])
const leaderboard = ref<any[]>([])

// Show answer state
const showAnswer = ref(false)
const correctAnswer = ref('')

// Computed
const puzzleId = computed(() => route.params.id as string)
const isExpired = computed(() => puzzle.value?.is_expired)
const hasSolved = computed(() => {
  return guesses.value.some((g: any) => g.is_correct)
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
  <div class="container mx-auto px-6 py-10 max-w-6xl">
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center min-h-[50vh]">
      <div class="text-center">
        <div class="loading loading-spinner loading-lg mb-6"></div>
        <p class="text-base-content/60">加载谜题...</p>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="alert alert-error">
      <i class="i-mdi-alert-circle" />
      <span>{{ error }}</span>
    </div>

    <!-- Puzzle content -->
    <div v-else-if="puzzle" class="grid grid-cols-1 xl:grid-cols-3 gap-8">
      <!-- Left column: Image and input -->
      <div class="xl:col-span-2 space-y-8">
        <!-- Puzzle image -->
        <div class="card bg-base-100">
          <figure class="p-6">
            <img
              :src="getR2ImageUrl(puzzle.image_url)"
              class="rounded-xl w-full max-h-[480px] object-contain"
              alt="谜题图片"
            />
          </figure>
        </div>

        <!-- Hint -->
        <div v-if="puzzle.hint" class="alert alert-info">
          <i class="i-mdi-lightbulb-on" />
          <span>{{ puzzle.hint }}</span>
        </div>

        <!-- Status alerts -->
        <div v-if="isExpired" class="alert alert-warning">
          <i class="i-mdi-alert" />
          <div class="flex-1">
            <h3 class="font-semibold">此谜题已过期</h3>
            <div class="text-sm opacity-80">过期后的猜测不会计入统计</div>
          </div>
          <button
            v-if="!showAnswer"
            class="btn btn-sm btn-warning"
            @click="revealAnswer"
          >
            查看答案
          </button>
        </div>

        <div v-if="showAnswer" class="alert alert-success">
          <i class="i-mdi-check-circle text-xl" />
          <div>
            <h3 class="font-semibold">正确答案是：</h3>
            <div class="text-lg font-mono mt-2">{{ correctAnswer }}</div>
          </div>
        </div>

        <div v-if="hasSolved && !showAnswer" class="alert alert-success">
          <i class="i-mdi-trophy text-xl" />
          <div>
            <h3 class="font-semibold">恭喜你答对了！</h3>
            <div class="text-sm opacity-80">你可以继续猜测，或查看排行榜</div>
          </div>
        </div>

        <!-- Guess input -->
        <div v-if="!hasSolved || !showAnswer" class="card bg-base-100">
          <div class="card-body p-8">
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
            <div class="card-actions justify-end mt-6">
              <button
                class="btn btn-primary btn-lg flex-1 gap-2"
                :disabled="!guess.trim() || submitting"
                @click="submitGuess"
              >
                <span v-if="submitting" class="loading loading-spinner"></span>
                <i class="i-mdi-send" />
                提交猜测
              </button>
            </div>
          </div>
        </div>

        <!-- Last guess result -->
        <div v-if="guessResult && !guessResult.is_correct" class="card bg-base-100 border-l-4 border-primary">
          <div class="card-body p-6">
            <p class="text-base font-medium mb-6">{{ guessResult.message }}</p>
            <div class="flex gap-4 justify-center flex-wrap">
              <div class="badge badge-lg badge-success gap-2 py-3 px-4">
                <i class="i-mdi-check-circle" />
                {{ guessResult.hint.correct_chars }} 个字符正确
              </div>
              <div class="badge badge-lg badge-info gap-2 py-3 px-4">
                <i class="i-mdi-target" />
                {{ guessResult.hint.correct_positions }} 个位置正确
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right column: History and Leaderboard -->
      <div class="space-y-8">
        <!-- Guess history -->
        <div v-if="guesses.length > 0" class="card bg-base-100">
          <div class="card-body p-0">
            <div class="px-6 pt-6 pb-4 border-b border-base-300">
              <h2 class="card-title text-lg">猜测历史 ({{ guesses.length }})</h2>
            </div>
            <div class="max-h-[400px] overflow-y-auto">
              <table class="table table-zebra table-sm">
                <thead class="sticky top-0 bg-base-100">
                  <tr>
                    <th class="py-3">猜测</th>
                    <th class="hidden sm:table-cell py-3">时间</th>
                    <th class="py-3">提示</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(g, idx) in guesses" :key="idx" :class="{ 'opacity-50': g.is_after_expiry }">
                    <td class="font-mono font-medium">{{ g.guess_answer }}</td>
                    <td class="hidden sm:table-cell text-sm opacity-70">{{ formatDate(g.guessed_at) }}</td>
                  >
                    <td>
                      <div v-if="!g.is_correct" class="flex gap-1 flex-wrap">
                        <span v-if="g.correct_chars !== undefined" class="badge badge-success text-xs">
                          {{ g.correct_chars }} 字符
                        </span>
                        <span v-if="g.correct_positions !== undefined" class="badge badge-info text-xs">
                          {{ g.correct_positions }} 位置
                        </span>
                        <span v-if="g.is_after_expiry" class="badge badge-ghost text-xs">过期</span>
                      </div>
                      <i v-else class="i-mdi-check-circle text-success text-lg"></i>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Leaderboard -->
        <div v-if="leaderboard.length > 0" class="card bg-base-100">
          <div class="card-body p-0">
            <div class="px-6 pt-6 pb-4 border-b border-base-300">
              <h2 class="card-title text-lg">成功排行榜</h2>
            </div>
            <div class="max-h-[300px] overflow-y-auto">
              <table class="table table-zebra table-sm">
                <thead class="sticky top-0 bg-base-100">
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
                    <td class="font-semibold">{{ entry.username }}</td>
                    <td>{{ formatTime(entry.time_to_solve) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- No solves yet -->
        <div v-else-if="!hasSolved" class="alert alert-ghost text-center">
          <i class="i-mdi-information" />
          <span>还没有人猜出这个谜题</span>
        </div>
      </div>
    </div>
  </div>
</template>
