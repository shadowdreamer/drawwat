<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import TldrawCanvas from '../components/TldrawCanvas.vue'
import ShareModal from '../components/ShareModal.vue'

const router = useRouter()
const authStore = useAuthStore()

const tldrawCanvasRef = ref<InstanceType<typeof TldrawCanvas> | null>(null)

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
    // Export canvas to blob image
    const imageBlob = await tldrawCanvasRef.value.exportAsImage()
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
  <div class="min-h-screen bg-base-200">
    <!-- Desktop: Side by Side Layout -->
    <div class="hidden lg:flex h-[calc(100vh-4rem)]">
      <!-- Left: Canvas Area -->
      <div class="flex-1 flex flex-col bg-base-300/30">
        <!-- Canvas Header -->
        <div class="flex items-center justify-between px-6 py-3 bg-base-100/80 backdrop-blur-sm border-b border-base-300 shrink-0">
          <div class="flex items-center gap-2">
            <i class="i-lucide-palette text-primary" />
            <h1 class="font-semibold">绘制区域</h1>
          </div>
          <div class="text-sm text-base-content/50">
            使用工具栏绘制你的谜题图片
          </div>
        </div>

        <!-- Canvas Container -->
        <div class="flex-1 min-h-0 p-4">
          <div class="tldraw-container h-full">
            <TldrawCanvas ref="tldrawCanvasRef" />
          </div>
        </div>
      </div>

      <!-- Right: Form Panel -->
      <div class="w-96 flex flex-col bg-base-100 border-l border-base-300 shadow-xl">
        <!-- Form Header -->
        <div class="px-6 py-4 border-b border-base-300 shrink-0">
          <h2 class="text-lg font-bold font-display">创建新谜题</h2>
          <p class="text-sm text-base-content/60 mt-1">设置答案和分享选项</p>
        </div>

        <!-- Scrollable Form Content -->
        <div class="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <!-- Error Alert -->
          <div v-if="error" class="alert alert-error alert-sm py-2">
            <i class="i-lucide-alert-circle text-sm" />
            <span class="text-sm">{{ error }}</span>
          </div>

          <!-- Answer Input -->
          <div class="form-control">
            <label class="label py-1">
              <span class="label-text font-medium">谜底答案</span>
              <span class="label-text-alt text-error">必填</span>
            </label>
            <input
              v-model="answer"
              type="text"
              class="input input-bordered input-sm"
              placeholder="输入正确答案..."
              maxlength="500"
            />
            <label class="label py-1">
              <span class="label-text-alt">{{ answerLength }} 个字符</span>
            </label>
          </div>

          <!-- Hint Input -->
          <div class="form-control">
            <label class="label py-1">
              <span class="label-text">提示语（可选）</span>
            </label>
            <textarea
              v-model="hint"
              class="textarea textarea-bordered textarea-sm h-20"
              placeholder="给猜谜者一些提示..."
              maxlength="500"
            ></textarea>
            <label class="label py-1">
              <span class="label-text-alt">给猜谜者一些提示帮助</span>
            </label>
          </div>

          <!-- Case Sensitive Checkbox -->
          <label class="label cursor-pointer justify-start gap-3 py-2">
            <input
              v-model="caseSensitive"
              type="checkbox"
              class="checkbox checkbox-sm checkbox-primary"
            />
            <span class="label-text text-sm">区分大小写</span>
          </label>

          <!-- Public Checkbox -->
          <label class="label cursor-pointer justify-start gap-3 py-2">
            <input
              v-model="isPublic"
              type="checkbox"
              class="checkbox checkbox-sm checkbox-primary"
            />
            <div class="flex flex-col">
              <span class="label-text text-sm">公开到广场</span>
              <span class="label-text-alt text-xs">取消后将仅在分享链接可见</span>
            </div>
          </label>

          <!-- Expiry Options -->
          <div>
            <label class="label py-1">
              <span class="label-text font-medium">过期时间</span>
            </label>
            <div class="grid grid-cols-3 gap-2">
              <label
                v-for="option in expiryOptions"
                :key="option.value"
                class="btn btn-xs btn-outline h-8"
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
            <p class="text-xs text-base-content/50 mt-2">过期后仍可猜测，但不计入统计</p>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="p-4 border-t border-base-300 space-y-2 shrink-0">
          <button
            class="btn btn-primary w-full gap-2"
            :disabled="!canSubmit || loading"
            @click="createPuzzle"
          >
            <span v-if="loading" class="loading loading-spinner loading-sm"></span>
            <i class="i-lucide-check" />
            生成谜题
          </button>
          <button
            class="btn btn-ghost btn-sm w-full gap-2"
            :disabled="loading"
            @click="resetForm"
          >
            <i class="i-lucide-refresh-cw" />
            重置
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile: Vertical Stack Layout -->
    <div class="lg:hidden">
      <!-- Canvas Section -->
      <section class="min-h-[70vh]">
        <div class="flex items-center justify-between px-4 py-3 bg-base-100/80 backdrop-blur-sm border-b border-base-300">
          <div class="flex items-center gap-2">
            <i class="i-lucide-palette text-primary" />
            <h1 class="font-semibold">绘制区域</h1>
          </div>
        </div>
        <div class="p-3">
          <div class="tldraw-container  h-[70vh] w-full">
            <TldrawCanvas ref="tldrawCanvasRef" />
          </div>
        </div>
      </section>

      <!-- Form Section -->
      <section class="bg-base-100 border-t border-base-300">
        <div class="container mx-auto px-4 py-6 max-w-lg">
          <h2 class="text-lg font-bold font-display mb-4">创建新谜题</h2>
          <p class="text-sm text-base-content/60 mb-6">设置答案和分享选项</p>

          <!-- Error Alert -->
          <div v-if="error" class="alert alert-error alert-sm py-2 mb-6">
            <i class="i-lucide-alert-circle text-sm" />
            <span class="text-sm">{{ error }}</span>
          </div>

          <div class="space-y-6">
            <!-- Answer Input -->
            <div class="form-control">
              <label class="label py-1">
                <span class="label-text font-medium">谜底答案</span>
                <span class="label-text-alt text-error">必填</span>
              </label>
              <input
                v-model="answer"
                type="text"
                class="input input-bordered"
                placeholder="输入正确答案..."
                maxlength="500"
              />
              <label class="label py-1">
                <span class="label-text-alt">{{ answerLength }} 个字符</span>
              </label>
            </div>

            <!-- Hint Input -->
            <div class="form-control">
              <label class="label py-1">
                <span class="label-text">提示语（可选）</span>
              </label>
              <textarea
                v-model="hint"
                class="textarea textarea-bordered h-24"
                placeholder="给猜谜者一些提示..."
                maxlength="500"
              ></textarea>
              <label class="label py-1">
                <span class="label-text-alt">给猜谜者一些提示帮助</span>
              </label>
            </div>

            <!-- Case Sensitive Checkbox -->
            <label class="label cursor-pointer justify-start gap-3 py-2">
              <input
                v-model="caseSensitive"
                type="checkbox"
                class="checkbox checkbox-primary"
              />
              <span class="label-text">区分大小写</span>
            </label>

            <!-- Public Checkbox -->
            <label class="label cursor-pointer justify-start gap-3 py-2">
              <input
                v-model="isPublic"
                type="checkbox"
                class="checkbox checkbox-primary"
              />
              <div class="flex flex-col">
                <span class="label-text">公开到广场</span>
                <span class="label-text-alt text-xs">取消后将仅在分享链接可见</span>
              </div>
            </label>

            <!-- Expiry Options -->
            <div>
              <label class="label py-1">
                <span class="label-text font-medium">过期时间</span>
              </label>
              <div class="flex flex-wrap gap-2">
                <label
                  v-for="option in expiryOptions"
                  :key="option.value"
                  class="btn btn-outline btn-sm"
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
              <p class="text-xs text-base-content/50 mt-2">过期后仍可猜测，但不计入统计</p>
            </div>

            <!-- Actions -->
            <div class="flex flex-col gap-3 pt-4">
              <button
                class="btn btn-primary w-full gap-2"
                :disabled="!canSubmit || loading"
                @click="createPuzzle"
              >
                <span v-if="loading" class="loading loading-spinner"></span>
                <i class="i-lucide-check" />
                生成谜题
              </button>
              <button
                class="btn btn-ghost w-full gap-2"
                :disabled="loading"
                @click="resetForm"
              >
                <i class="i-lucide-refresh-cw" />
                重置
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Share Modal -->
    <ShareModal
      :show="showShareModal"
      :puzzle-id="createdPuzzleId"
      @close="closeShareModal"
    />
  </div>
</template>

<style scoped>
.tldraw-container {
  border: 1px solid hsl(var(--b3));
  border-radius: 0.75rem;
  overflow: hidden;
  background: hsl(var(--b1));
}
</style>
