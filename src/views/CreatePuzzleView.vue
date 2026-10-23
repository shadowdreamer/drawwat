<script setup lang="ts">
import { ref, computed, defineAsyncComponent } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { onClickOutside } from '@vueuse/core'
import { useAuthStore } from '../store/auth'
import type { DrawingCanvas } from '../components/drawing-canvas'
import ShareModal from '../components/ShareModal.vue'

const router = useRouter()
const authStore = useAuthStore()

// Keep both editor dependencies (including their CSS) out of the page chunk.
const ExcalidrawCanvas = defineAsyncComponent(() => import('../components/ExcalidrawCanvas.vue'))
const KlecksCanvas = defineAsyncComponent(() => import('../components/KlecksCanvas.vue'))
type Board = 'excalidraw' | 'klecks'
const boards = [
  { id: 'klecks', name: 'Klecks', icon: 'i-lucide-paintbrush', description: '自然笔刷、压感与图层，适合手绘涂鸦。' },
  { id: 'excalidraw', name: 'Excalidraw', icon: 'i-lucide-shapes', description: '手绘风形状、箭头与文字，适合示意表达。' },
] as const
const BOARD_KEY = 'drawwat-board-preference-v1'
function readBoard(): Board {
  try {
    return localStorage.getItem(BOARD_KEY) === 'excalidraw' ? 'excalidraw' : 'klecks'
  } catch {
    return 'klecks'
  }
}
const board = ref<Board>(readBoard())
const currentBoard = computed(() => boards.find(option => option.id === board.value)!)
const boardPicker = ref<HTMLDetailsElement | null>(null)
function closeBoardPicker(restoreFocus = false) {
  boardPicker.value?.removeAttribute('open')
  if (restoreFocus) boardPicker.value?.querySelector('summary')?.focus()
}
onClickOutside(boardPicker, () => closeBoardPicker(), { detectIframe: true })
const loadedBoards = ref({ excalidraw: board.value === 'excalidraw', klecks: board.value === 'klecks' })
const excalidrawRef = ref<DrawingCanvas | null>(null)
const klecksRef = ref<DrawingCanvas | null>(null)
const canvasRef = computed(() => board.value === 'klecks' ? klecksRef.value : excalidrawRef.value)
const switchingBoard = ref(false)
const preferenceWarning = ref('')

async function switchBoard(next: Board) {
  closeBoardPicker(true)
  if (next === board.value || loading.value || switchingBoard.value) return
  switchingBoard.value = true
  try {
    await canvasRef.value?.saveDraft?.()
    loadedBoards.value[next] = true
    board.value = next
    try {
      localStorage.setItem(BOARD_KEY, next)
      preferenceWarning.value = ''
    } catch {
      preferenceWarning.value = '浏览器无法保存画板偏好。'
    }
  } catch {
    error.value = '草稿保存失败，请先生成谜题或稍后再切换。'
  } finally {
    switchingBoard.value = false
  }
}

onBeforeRouteLeave(async () => {
  try {
    await klecksRef.value?.saveDraft?.()
  } catch {
    error.value = '草稿保存失败，请先生成谜题或稍后再离开。'
    return false
  }
})

// Form data
const answer = ref('')
const hint = ref('')
const caseSensitive = ref(false)
const isPublic = ref(true) // Default public
const expiresIn = ref(1209600) // Default 14 days

// UI state
const loading = ref(false)
const error = ref('')
const showShareModal = ref(false)
const createdPuzzleId = ref('')

// Expiry options
const expiryOptions = [
  { label: '2周', value: 1209600 },
  { label: '1周', value: 604800 },
  { label: '3天', value: 259200 },
  { label: '1天', value: 86400 },
  { label: '永久', value: 0 }
]

// Computed
const canSubmit = computed(() => {
  return answer.value.trim().length > 0
})

const answerLength = computed(() => answer.value.length)

// Reset form
async function resetForm() {
  try {
    await canvasRef.value?.clearCanvas()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '画板重置失败，请重试'
    return
  }
  answer.value = ''
  hint.value = ''
  caseSensitive.value = false
  isPublic.value = true
  expiresIn.value = 1209600
  error.value = ''
}

// Create puzzle
async function createPuzzle() {
  if (!canSubmit.value || loading.value || switchingBoard.value) return
  if (!canvasRef.value) {
    error.value = '画板未加载'
    return
  }

  loading.value = true
  error.value = ''

  try {
    // Export canvas to blob image
    const imageBlob = await canvasRef.value.exportAsImage()
    if (!imageBlob) {
      error.value = '请先在画板上绘制内容'
      return
    }

    // Create FormData
    const formData = new FormData()
    formData.append('image', imageBlob, 'puzzle.webp')
    formData.append('answer', answer.value.trim())
    if (hint.value.trim()) {
      formData.append('hint', hint.value.trim())
    }
    formData.append('case_sensitive', String(caseSensitive.value))
    formData.append('is_public', String(isPublic.value))
    formData.append('expires_in', String(expiresIn.value))

    const response = await fetch('/api/puzzles', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      },
      body: formData
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || '创建失败')
    }

    const data = await response.json()
    createdPuzzleId.value = data.id
    showShareModal.value = true
    await resetForm()
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : '创建失败'
  } finally {
    loading.value = false
  }
}

// Close share modal and go to home
function closeShareModal() {
  showShareModal.value = false
  createdPuzzleId.value = ''
  router.push('/')
}
</script>

<template>
  <div class="studio-page">
    <div class="studio-layout">
      <section class="studio-canvas-panel" aria-label="绘图画板">
        <div class="studio-panel-title">
          <details ref="boardPicker" class="board-picker" @keydown.esc.prevent="closeBoardPicker(true)">
            <summary aria-label="选择画板" aria-controls="board-options" @click="(loading || switchingBoard) && $event.preventDefault()">
              <i :class="currentBoard.icon" aria-hidden="true" />
              <span>自由绘制 <b>· {{ currentBoard.name }}</b></span>
              <i class="i-lucide-chevron-down board-picker-chevron" aria-hidden="true" />
            </summary>
            <div id="board-options" class="board-options" aria-label="可用画板">
              <p class="board-options-heading">选择适合你的画板</p>
              <button v-for="option in boards" :key="option.id" type="button" class="board-option" :class="{ 'board-option-active': board === option.id }" :aria-pressed="board === option.id" :disabled="loading || switchingBoard" @click="switchBoard(option.id)">
                <i :class="option.icon" class="board-option-icon" aria-hidden="true" />
                <span class="board-option-copy"><strong>{{ option.name }}<em v-if="option.id === 'klecks'">默认</em></strong><span>{{ option.description }}</span></span>
                <i v-if="board === option.id" class="i-lucide-check board-option-check" aria-hidden="true" />
              </button>
            </div>
          </details>
          <small>绘制你的惊世智慧</small>
        </div>
        <div v-if="preferenceWarning" role="status" class="text-xs p-2 bg-warning text-warning-content">{{ preferenceWarning }}</div>
        <div class="studio-canvas">
          <ExcalidrawCanvas v-if="loadedBoards.excalidraw" v-show="board === 'excalidraw'" ref="excalidrawRef" />
          <KlecksCanvas v-if="loadedBoards.klecks" v-show="board === 'klecks'" ref="klecksRef" @submit="createPuzzle" />
        </div>
      </section>
      <section class="studio-settings" aria-labelledby="puzzle-settings-title">
        <h2 id="puzzle-settings-title">给画作一个谜底</h2>
        <div v-if="error" class="alert alert-error mb-4" role="alert"><i class="i-lucide-alert-circle" /><span>{{ error }}</span></div>
        <form @submit.prevent="createPuzzle">
          <div class="form-control"><label class="label" for="puzzle-answer"><span class="label-text">谜底答案 <span class="text-error">*</span></span><span class="label-text-alt">{{ answerLength }}/500</span></label><input id="puzzle-answer" v-model="answer" class="input" placeholder="输入正确答案..." maxlength="500" required><p class="text-xs text-base-content/60 mt-2 mb-0">只有猜对或揭晓后，才能看到答案。</p></div>
          <div class="form-control"><label class="label" for="puzzle-hint"><span class="label-text">留一点提示</span><span class="label-text-alt">可选</span></label><textarea id="puzzle-hint" v-model="hint" class="textarea h-24" placeholder="比如：一部关于太空的电影…" maxlength="500" /></div>
          <label class="setting-switch"><span>公开到广场<small>让更多人发现你的脑洞</small></span><input v-model="isPublic" type="checkbox" class="toggle toggle-primary toggle-sm"></label>
          <label class="setting-switch"><span>区分字母大小写<small>中文答案不受影响</small></span><input v-model="caseSensitive" type="checkbox" class="toggle toggle-primary toggle-sm"></label>
          <fieldset class="pt-4 border-t border-base-300"><legend class="text-sm pt-3">挑战有效期</legend><div class="expiry-options"><label v-for="option in expiryOptions" :key="option.value" class="expiry-choice"><input v-model="expiresIn" type="radio" name="expiry" :value="option.value">{{ option.label }}</label></div><p class="text-xs text-base-content/60 mt-3 mb-0">过期后仍可猜测，但不计入统计。</p></fieldset>
          <div class="studio-actions"><button type="submit" class="btn btn-primary" :disabled="!canSubmit || loading || switchingBoard"><span v-if="loading" class="loading loading-spinner" /><i v-else class="i-lucide-sparkles" /> {{ loading ? '正在生成…' : '生成谜题' }}<i class="i-lucide-arrow-right" /></button><button type="button" class="btn btn-ghost" :disabled="loading || switchingBoard" @click="resetForm"><i class="i-lucide-rotate-ccw" /> 重置</button></div>
        </form>
      </section>
    </div>
    <ShareModal :show="showShareModal" :puzzle-id="createdPuzzleId" @close="closeShareModal" />
  </div>
</template>
