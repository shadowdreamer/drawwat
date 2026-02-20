<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import TldrawCanvas from '../components/TldrawCanvas.vue'

const router = useRouter()
const authStore = useAuthStore()

const tldrawCanvasRef = ref<InstanceType<typeof TldrawCanvas> | null>(null)

// Form data
const answer = ref('')
const hint = ref('')
const caseSensitive = ref(false)
const expiresIn = ref(1209600) // Default 14 days

// UI state
const loading = ref(false)
const error = ref('')
const showShareModal = ref(false)
const shareUrl = ref('')

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
  expiresIn.value = 1209600
  error.value = ''
  tldrawCanvasRef.value?.clearCanvas()
}

// Create puzzle
async function createPuzzle() {
  if (!canSubmit.value || loading.value) return
  if (!tldrawCanvasRef.value) {
    error.value = '画板未加载'
    return
  }

  loading.value = true
  error.value = ''

  try {
    // Export canvas to base64 image
    const imageData = await tldrawCanvasRef.value.exportAsImage()
    const response = await fetch('/api/puzzles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        image_data: imageData,
        answer: answer.value.trim(),
        hint: hint.value.trim() || undefined,
        case_sensitive: caseSensitive.value,
        expires_in: expiresIn.value
      })
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || '创建失败')
    }

    const data = await response.json()
    shareUrl.value = data.share_url
    showShareModal.value = true
    resetForm()
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : '创建失败'
  } finally {
    loading.value = false
  }
}

// Copy share link
async function copyLink() {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
  } catch (err) {
    error.value = '复制失败'
  }
}

// Close share modal and go to home
function closeShareModal() {
  showShareModal.value = false
  router.push('/')
}
</script>

<template>
  <div class="container mx-auto px-6 py-12 max-w-2xl">
    <!-- Header -->
    <div class="mb-12">
      <h1 class="text-2xl sm:text-3xl font-bold font-display mb-3">创建新谜题</h1>
      <p class="text-base-content/60">在画板上绘制图片，设置答案，生成分享链接</p>
    </div>

    <!-- Error alert -->
    <div v-if="error" class="alert alert-error mb-8">
      <i class="i-mdi-alert-circle" />
      <span>{{ error }}</span>
    </div>

    <!-- Canvas section -->
    <section class="mb-10">
      <div class="card bg-base-100">
        <div class="card-body p-8">
          <h2 class="card-title text-lg mb-6 flex items-center gap-3">
            <span class="w-7 h-7 rounded-full bg-primary text-primary-content flex items-center justify-center text-sm font-medium">1</span>
            绘制图片
          </h2>

          <div class="tldraw-container">
            <TldrawCanvas ref="tldrawCanvasRef" />
          </div>
          <p class="text-xs text-base-content/50 mt-3 text-center">使用画板绘制你的谜题图片</p>
        </div>
      </div>
    </section>

    <!-- Answer and hint -->
    <section class="mb-10">
      <div class="card bg-base-100">
        <div class="card-body p-8">
          <h2 class="card-title text-lg mb-6 flex items-center gap-3">
            <span class="w-7 h-7 rounded-full bg-primary text-primary-content flex items-center justify-center text-sm font-medium">2</span>
            设置答案
          </h2>

          <div class="form-control mb-6">
            <label class="label">
              <span class="label-text font-medium">谜底答案</span>
              <span class="label-text-alt text-error">必填</span>
            </label>
            <input
              v-model="answer"
              type="text"
              class="input input-bordered w-full"
              placeholder="输入正确答案..."
              maxlength="500"
            />
            <label class="label">
              <span class="label-text-alt">{{ answerLength }} 个字符</span>
            </label>
          </div>

          <div class="form-control mb-6">
            <label class="label">
              <span class="label-text">提示语（可选）</span>
            </label>
            <textarea
              v-model="hint"
              class="textarea textarea-bordered h-24"
              placeholder="给猜谜者一些提示..."
              maxlength="500"
            ></textarea>
          </div>

          <label class="label cursor-pointer justify-start gap-3">
            <input
              v-model="caseSensitive"
              type="checkbox"
              class="checkbox checkbox-primary"
            />
            <span class="label-text">区分大小写</span>
          </label>
        </div>
      </div>
    </section>

    <!-- Expiry time -->
    <section class="mb-10">
      <div class="card bg-base-100">
        <div class="card-body p-8">
          <h2 class="card-title text-lg mb-6 flex items-center gap-3">
            <span class="w-7 h-7 rounded-full bg-primary text-primary-content flex items-center justify-center text-sm font-medium">3</span>
            过期时间
          </h2>

          <div class="flex flex-wrap gap-3">
            <label
              v-for="option in expiryOptions"
              :key="option.value"
              class="btn btn-outline"
              :class="{ 'btn-active': expiresIn === option.value }"
            >
              <input
                :id="`expiry-${option.value}`"
                v-model="expiresIn"
                type="radio"
                :value="option.value"
                class="hidden"
              />
              {{ option.label }}
            </label>
          </div>
          <label class="label mt-3">
            <span class="label-text-alt">过期后仍可猜测，但不计入统计</span>
          </label>
        </div>
      </div>
    </section>

    <!-- Actions -->
    <div class="flex flex-col sm:flex-row gap-4">
      <button
        class="btn btn-primary flex-1 gap-2"
        :disabled="!canSubmit || loading"
        @click="createPuzzle"
      >
        <span v-if="loading" class="loading loading-spinner"></span>
        <i class="i-mdi-check" />
        生成谜题
      </button>
      <button
        class="btn btn-ghost gap-2"
        :disabled="loading"
        @click="resetForm"
      >
        <i class="i-mdi-refresh" />
        重置
      </button>
    </div>

    <!-- Share modal -->
    <dialog v-if="showShareModal" class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-6 flex items-center gap-3">
          <span class="text-2xl">🎉</span>
          谜题创建成功！
        </h3>
        <p class="mb-6 text-base-content/80">复制下面的链接分享给朋友：</p>
        <div class="join w-full mb-6">
          <input
            :value="shareUrl"
            class="input input-bordered join-item flex-1"
            readonly
          />
          <button class="btn btn-primary join-item gap-2" @click="copyLink">
            <i class="i-mdi-content-copy" />
            复制
          </button>
        </div>
        <div class="modal-action">
          <button class="btn btn-ghost" @click="closeShareModal">关闭</button>
        </div>
      </div>
      <div class="modal-backdrop" @click="closeShareModal"></div>
    </dialog>
  </div>
</template>

<style scoped>
.tldraw-container {
  border: 1px solid hsl(var(--b3));
  border-radius: 0.75rem;
  overflow: hidden;
}
</style>
