<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'

const router = useRouter()
const authStore = useAuthStore()

// Form data
const imageFile = ref<File | null>(null)
const imageData = ref('')
const previewImage = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
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
  return imageData.value && answer.value.trim().length > 0
})

const answerLength = computed(() => answer.value.length)

// Handle file selection
function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    error.value = '请选择图片文件'
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    error.value = '图片大小不能超过 5MB'
    return
  }

  imageFile.value = file
  error.value = ''

  const reader = new FileReader()
  reader.onload = (e) => {
    imageData.value = e.target?.result as string
    previewImage.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

// Handle drag and drop
function handleDragOver(event: DragEvent) {
  event.preventDefault()
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  const file = event.dataTransfer?.files[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    error.value = '请选择图片文件'
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    error.value = '图片大小不能超过 5MB'
    return
  }

  imageFile.value = file
  error.value = ''

  const reader = new FileReader()
  reader.onload = (e) => {
    imageData.value = e.target?.result as string
    previewImage.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

// Clear image
function clearImage() {
  imageFile.value = null
  imageData.value = ''
  previewImage.value = ''
}

// Reset form
function resetForm() {
  clearImage()
  answer.value = ''
  hint.value = ''
  caseSensitive.value = false
  expiresIn.value = 1209600
  error.value = ''
}

// Create puzzle
async function createPuzzle() {
  if (!canSubmit.value || loading.value) return

  loading.value = true
  error.value = ''

  try {
    const response = await fetch('/api/puzzles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        image_data: imageData.value,
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
  <div class="container mx-auto px-4 py-8 max-w-2xl">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl sm:text-3xl font-bold font-display mb-2">创建新谜题</h1>
      <p class="text-base-content/60">上传图片，设置答案，生成分享链接</p>
    </div>

    <!-- Error alert -->
    <div v-if="error" class="alert alert-error mb-6">
      <i class="i-mdi-alert-circle" />
      <span>{{ error }}</span>
    </div>

    <!-- Image upload -->
    <section class="mb-8">
      <div class="card bg-base-100">
        <div class="card-body p-6">
          <h2 class="card-title text-lg mb-4 flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-primary text-primary-content flex items-center justify-center text-sm">1</span>
            上传图片
          </h2>

          <div v-if="!previewImage"
            class="border-2 border-dashed border-base-300 rounded-xl p-12 text-center hover:border-primary cursor-pointer"
            @dragover.prevent="handleDragOver"
            @drop.prevent="handleDrop"
            @click="fileInput?.click()"
          >
            <i class="i-mdi-cloud-upload text-4xl text-base-content/40 mb-3" />
            <p class="text-sm mb-1">拖拽图片到这里，或点击上传</p>
            <p class="text-xs text-base-content/50">JPG、PNG、WEBP（最大 5MB）</p>
          </div>

          <div v-else class="relative">
            <img :src="previewImage" class="rounded-xl max-h-80 w-full object-cover" />
            <button
              class="btn btn-circle btn-ghost absolute top-2 right-2 bg-base-100/90"
              @click="clearImage"
            >
              <i class="i-mdi-close" />
            </button>
          </div>

          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleFileSelect"
          />
        </div>
      </div>
    </section>

    <!-- Answer and hint -->
    <section class="mb-8">
      <div class="card bg-base-100">
        <div class="card-body p-6">
          <h2 class="card-title text-lg mb-4 flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-primary text-primary-content flex items-center justify-center text-sm">2</span>
            设置答案
          </h2>

          <div class="form-control mb-4">
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

          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">提示语（可选）</span>
            </label>
            <textarea
              v-model="hint"
              class="textarea textarea-bordered h-20"
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
    <section class="mb-8">
      <div class="card bg-base-100">
        <div class="card-body p-6">
          <h2 class="card-title text-lg mb-4 flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-primary text-primary-content flex items-center justify-center text-sm">3</span>
            过期时间
          </h2>

          <div class="flex flex-wrap gap-2">
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
          <label class="label mt-2">
            <span class="label-text-alt">过期后仍可猜测，但不计入统计</span>
          </label>
        </div>
      </div>
    </section>

    <!-- Actions -->
    <div class="flex flex-col sm:flex-row gap-3">
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
        <h3 class="font-bold text-lg mb-4 flex items-center gap-2">
          <span class="text-2xl">🎉</span>
          谜题创建成功！
        </h3>
        <p class="mb-4 text-base-content/80">复制下面的链接分享给朋友：</p>
        <div class="join w-full mb-4">
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
