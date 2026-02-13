<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'

const route = useRoute()
const router = useRouter()
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

    // Add to guesses list
    guesses.value.unshift({
      guess_answer: trimmedGuess,
      is_correct: result.is_correct,
      correct_chars: result.hint?.correct_chars,
      correct_positions: result.hint?.correct_positions,
      is_after_expiry: result.is_expired,
      guessed_at: new Date().toISOString()
    })

    // Clear input
    guess.value = ''

    // If correct, reload leaderboard
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
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center min-h-[50vh]">
      <div class="text-center">
        <div class="loading loading-spinner loading-lg mb-4"></div>
        <p>加载谜题...</p>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="alert alert-error">
      <i class="i-mdi-alert-circle text-xl" />
      <span>{{ error }}</span>
    </div>

    <!-- Puzzle content -->
    <div v-else-if="puzzle">
      <!-- Puzzle image -->
      <div class="card bg-base-200 shadow-xl mb-6">
        <figure class="px-4 pt-4">
          <img
            :src="puzzle.image_url"
            class="rounded-xl w-full max-h-[500px] object-contain"
            alt="谜题图片"
          />
        </figure>
      </div>

      <!-- Hint -->
      <div v-if="puzzle.hint" class="alert alert-info mb-6">
        <i class="i-mdi-lightbulb text-xl" />
        <span>{{ puzzle.hint }}</span>
      </div>

      <!-- Expired notice -->
      <div v-if="isExpired" class="alert alert-warning mb-6">
        <i class="i-mdi-alert text-xl" />
        <div>
          <h3 class="font-bold">此谜题已过期</h3>
          <div class="text-sm">过期后的猜测不会计入统计</div>
        </div>
        <button
          v-if="!showAnswer"
          class="btn btn-sm btn-warning"
          @click="revealAnswer"
        >
          查看答案
        </button>
      </div>

      <!-- Correct answer revealed -->
      <div v-if="showAnswer" class="alert alert-success mb-6">
        <i class="i-mdi-check-circle text-xl" />
        <div>
          <h3 class="font-bold">正确答案是：</h3>
          <div class="text-lg font-mono">{{ correctAnswer }}</div>
        </div>
      </div>

      <!-- Success message -->
      <div v-if="hasSolved && !showAnswer" class="alert alert-success mb-6">
        <i class="i-mdi-trophy text-xl" />
        <div>
          <h3 class="font-bold">恭喜你答对了！</h3>
          <div class="text-sm">你可以继续猜测，或查看排行榜</div>
        </div>
      </div>

      <!-- Guess input (only show if not solved or not revealed) -->
      <div v-if="!hasSolved || !showAnswer" class="card bg-base-100 shadow-lg mb-6">
        <div class="card-body">
          <div class="form-control">
            <label class="label">
              <span class="label-text text-lg">输入你的答案</span>
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
          <div class="card-actions justify-end mt-4">
            <button
              class="btn btn-primary btn-lg w-full gap-2"
              :disabled="!guess.trim() || submitting"
              @click="submitGuess"
            >
              <span v-if="submitting" class="loading loading-spinner"></span>
              <i class="i-mdi-send" />
              {{ submitting ? '提交中...' : '提交猜测' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Last guess result -->
      <div v-if="guessResult && !guessResult.is_correct" class="text-center mb-6">
        <p class="text-lg mb-4">{{ guessResult.message }}</p>
        <div class="flex gap-2 justify-center flex-wrap">
          <div class="badge badge-lg badge-success gap-1">
            <i class="i-mdi-check-circle" />
            {{ guessResult.hint.correct_chars }} 个字符正确
          </div>
          <div class="badge badge-lg badge-info gap-1">
            <i class="i-mdi-target" />
            {{ guessResult.hint.correct_positions }} 个位置正确
          </div>
        </div>
      </div>

      <!-- Guess history -->
      <div v-if="guesses.length > 0" class="card bg-base-100 shadow-lg mb-6">
        <div class="card-body">
          <h2 class="card-title mb-4">
            <i class="i-mdi-history" />
            猜测历史 ({{ guesses.length }})
          </h2>
          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th>猜测</th>
                  <th>时间</th>
                  <th>提示</th>
                  <th>结果</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="g in guesses" :key="g.id" :class="{ 'opacity-50': g.is_after_expiry }">
                  <td class="font-mono">{{ g.guess_answer }}</td>
                  <td class="text-sm opacity-70">{{ formatDate(g.guessed_at) }}</td>
                  <td v-if="!g.is_correct">
                    <span v-if="g.correct_chars !== undefined" class="badge badge-success text-xs mr-1">
                      {{ g.correct_chars }} 字符
                    </span>
                    <span v-if="g.correct_positions !== undefined" class="badge badge-info text-xs">
                      {{ g.correct_positions }} 位置
                    </span>
                    <span v-if="g.is_after_expiry" class="badge badge-ghost text-xs ml-1">过期</span>
                  </td>
                  <td v-else>
                    <i class="i-mdi-check-circle text-success text-xl" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Leaderboard -->
      <div v-if="leaderboard.length > 0" class="card bg-base-100 shadow-lg mb-6">
        <div class="card-body">
          <h2 class="card-title mb-4">
            <i class="i-mdi-trophy" />
            成功排行榜
          </h2>
          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th>排名</th>
                  <th>用户</th>
                  <th>用时</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(entry, index) in leaderboard" :key="entry.user_id">
                  <td>
                    <span v-if="index === 0" class="text-2xl">🥇</span>
                    <span v-else-if="index === 1" class="text-2xl">🥈</span>
                    <span v-else-if="index === 2" class="text-2xl">🥉</span>
                    <span v-else class="badge badge-ghost">#{{ index + 1 }}</span>
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
      <div v-else-if="!hasSolved" class="alert alert-ghost">
        <i class="i-mdi-information text-xl" />
        <span>还没有人猜出这个谜题，成为第一个吧！</span>
      </div>
    </div>
  </div>
</template>
