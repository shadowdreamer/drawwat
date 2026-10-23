<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import ExcalidrawCanvas from '../components/ExcalidrawCanvas.vue'
import ShareModal from '../components/ShareModal.vue'

const router = useRouter()
const authStore = useAuthStore()

const canvasRef = ref<InstanceType<typeof ExcalidrawCanvas> | null>(null)

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
function resetForm() {
  answer.value = ''
  hint.value = ''
  caseSensitive.value = false
  isPublic.value = true
  expiresIn.value = 1209600
  error.value = ''
  canvasRef.value?.clearCanvas()
}

// Create puzzle
async function createPuzzle() {
  if (!canSubmit.value || loading.value) return
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
    resetForm()
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
      <section class="studio-canvas-panel" aria-label="绘图画板"><div class="studio-panel-title"><span><i class="i-lucide-pencil-line" /> 自由绘制</span><small>绘制你的惊世智慧</small></div><div class="studio-canvas"><ExcalidrawCanvas ref="canvasRef" /></div></section>
      <section class="studio-settings" aria-labelledby="puzzle-settings-title">
        <h2 id="puzzle-settings-title">给画作一个谜底</h2>
        <div v-if="error" class="alert alert-error mb-4" role="alert"><i class="i-lucide-alert-circle" /><span>{{ error }}</span></div>
        <form @submit.prevent="createPuzzle">
          <div class="form-control"><label class="label" for="puzzle-answer"><span class="label-text">谜底答案 <span class="text-error">*</span></span><span class="label-text-alt">{{ answerLength }}/500</span></label><input id="puzzle-answer" v-model="answer" class="input" placeholder="输入正确答案..." maxlength="500" required><p class="text-xs text-base-content/60 mt-2 mb-0">只有猜对或揭晓后，才能看到答案。</p></div>
          <div class="form-control"><label class="label" for="puzzle-hint"><span class="label-text">留一点提示</span><span class="label-text-alt">可选</span></label><textarea id="puzzle-hint" v-model="hint" class="textarea h-24" placeholder="比如：一部关于太空的电影…" maxlength="500" /></div>
          <label class="setting-switch"><span>公开到广场<small>让更多人发现你的脑洞</small></span><input v-model="isPublic" type="checkbox" class="toggle toggle-primary toggle-sm"></label>
          <label class="setting-switch"><span>区分字母大小写<small>中文答案不受影响</small></span><input v-model="caseSensitive" type="checkbox" class="toggle toggle-primary toggle-sm"></label>
          <fieldset class="pt-4 border-t border-base-300"><legend class="text-sm pt-3">挑战有效期</legend><div class="expiry-options"><label v-for="option in expiryOptions" :key="option.value" class="expiry-choice"><input v-model="expiresIn" type="radio" name="expiry" :value="option.value">{{ option.label }}</label></div><p class="text-xs text-base-content/60 mt-3 mb-0">过期后仍可猜测，但不计入统计。</p></fieldset>
          <div class="studio-actions"><button type="submit" class="btn btn-primary" :disabled="!canSubmit || loading"><span v-if="loading" class="loading loading-spinner" /><i v-else class="i-lucide-sparkles" /> {{ loading ? '正在生成…' : '生成谜题' }}<i class="i-lucide-arrow-right" /></button><button type="button" class="btn btn-ghost" :disabled="loading" @click="resetForm"><i class="i-lucide-rotate-ccw" /> 重置</button></div>
        </form>
      </section>
    </div>
    <ShareModal :show="showShareModal" :puzzle-id="createdPuzzleId" @close="closeShareModal" />
  </div>
</template>
