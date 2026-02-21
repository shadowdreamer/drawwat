<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface WrongGuess {
  guess_answer: string
  count: number
}

const props = defineProps<{
  puzzleId: string
}>()

const wrongGuesses = ref<WrongGuess[]>([])
const loading = ref(true)
const isExpanded = ref(false)
const hasLoaded = ref(false)

// Display limit before expand
const DISPLAY_LIMIT = 10

// Displayed guesses based on isExpanded state
const displayedGuesses = computed(() => {
  if (isExpanded.value) {
    return wrongGuesses.value
  }
  return wrongGuesses.value.slice(0, DISPLAY_LIMIT)
})

// Toggle expand/collapse
function toggle() {
  isExpanded.value = !isExpanded.value
}

async function loadWrongGuesses() {
  loading.value = true

  try {
    const response = await fetch(`/api/puzzles/${props.puzzleId}/wrong-guesses`)
    if (response.ok) {
      const data = await response.json()
      wrongGuesses.value = data.wrong_guesses || []
    }
  } catch (err) {
    console.error('Failed to load wrong guesses:', err)
  } finally {
    loading.value = false
    hasLoaded.value = true
  }
}

onMounted(() => {
  loadWrongGuesses()
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
          <h3 class="card-title text-sm">错误答案</h3>
          <span v-if="hasLoaded && wrongGuesses.length > 0" class="badge badge-ghost badge-xs">
            {{ wrongGuesses.length }}
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
            <h3 class="card-title text-sm">错误答案</h3>
            <span v-if="hasLoaded && wrongGuesses.length > 0" class="badge badge-ghost badge-xs">
              {{ wrongGuesses.length }}
            </span>
          </div>
          <i class="i-lucide-chevron-up text-base-content/60" />
        </div>

        <!-- Loading -->
        <div v-if="loading" class="p-6 text-center">
          <div class="loading loading-spinner loading-sm"></div>
        </div>

        <!-- No wrong guesses -->
        <div v-else-if="wrongGuesses.length === 0" class="p-6 text-center text-sm text-base-content/60">
          <i class="i-lucide-check-circle text-success mb-2" />
          <p>还没有错误答案</p>
        </div>

        <!-- Wrong guesses list -->
        <div v-else class="p-4">
          <div class="flex flex-wrap gap-2">
            <div
              v-for="item in displayedGuesses"
              :key="item.guess_answer"
              class="badge badge-lg gap-1"
              :class="item.count >= 3 ? 'badge-error' : item.count >= 2 ? 'badge-warning' : 'badge-ghost'"
            >
              <span class="font-mono">{{ item.guess_answer }}</span>
              <span class="opacity-60 text-xs">×{{ item.count }}</span>
            </div>
          </div>

          <!-- Show more button -->
          <button
            v-if="wrongGuesses.length > DISPLAY_LIMIT"
            class="btn btn-ghost btn-sm w-full mt-3 gap-1"
            @click.stop="toggle"
          >
            <span>收起</span>
            <i class="i-lucide-chevron-up" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
