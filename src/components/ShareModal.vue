<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  show: boolean
  puzzleId: string
}>()

const emit = defineEmits<{
  close: []
}>()

const copied = ref<'url' | 'greeting' | null>(null)
const copyError = ref('')

const baseUrl = window.location.origin
const shareUrl = computed(() => `${baseUrl}/puzzle/${props.puzzleId}`)
const greetingMessage = computed(() => `我画了一幅画，猜猜是什么？\n${shareUrl.value}`)

async function copyUrl() {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copied.value = 'url'
    copyError.value = ''
    setTimeout(() => {
      copied.value = null
    }, 2000)
  } catch (err) {
    copyError.value = '复制失败'
  }
}

async function copyWithGreeting() {
  try {
    await navigator.clipboard.writeText(greetingMessage.value)
    copied.value = 'greeting'
    copyError.value = ''
    setTimeout(() => {
      copied.value = null
    }, 2000)
  } catch (err) {
    copyError.value = '复制失败'
  }
}

function handleClose() {
  copied.value = null
  copyError.value = ''
  emit('close')
}
</script>

<template>
  <dialog v-if="show" class="modal modal-open">
    <div class="modal-box max-w-md">
      <h3 class="font-bold text-lg mb-6 flex items-center gap-3">
        <span class="text-2xl">🔗</span>
        <span>分享谜题</span>
      </h3>
      <p class="mb-6 text-base-content/80">选择分享方式：</p>

      <div class="space-y-4">
        <!-- Copy URL Only -->
        <div class="card bg-base-200">
          <div class="card-body p-4">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <i class="i-lucide-link text-primary" />
                <span class="font-medium">复制链接</span>
              </div>
              <span class="badge badge-ghost text-xs">仅 URL</span>
            </div>
            <div class="join w-full">
              <input
                :value="shareUrl"
                class="input input-bordered input-sm join-item flex-1 text-xs"
                readonly
              />
              <button
                class="btn btn-primary join-item btn-sm"
                :class="{ 'btn-success': copied === 'url' }"
                @click="copyUrl"
              >
                <i class="i-lucide-copy" />
                {{ copied === 'url' ? '已复制' : '复制' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Copy with Greeting -->
        <div class="card bg-base-200">
          <div class="card-body p-4">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <i class="i-lucide-message-circle text-warning" />
                <span class="font-medium">复制链接+问候语</span>
              </div>
              <span class="badge badge-warning text-xs">含文案</span>
            </div>
            <p class="text-xs text-base-content/60 mb-3">复制内容预览：</p>
            <div class="bg-base-100 rounded-lg p-3 text-xs font-mono mb-3 border border-base-300">
              我画了一幅画，猜猜是什么？<br/>
              <span class="opacity-70">{{ shareUrl }}</span>
            </div>
            <button
              class="btn btn-warning btn-sm w-full"
              :class="{ 'btn-success': copied === 'greeting' }"
              @click="copyWithGreeting"
            >
              <i class="i-lucide-copy" />
              {{ copied === 'greeting' ? '已复制' : '复制问候语+链接' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="copyError" class="alert alert-error alert-sm py-2 mt-4">
        <i class="i-lucide-alert-circle text-sm" />
        <span class="text-sm">{{ copyError }}</span>
      </div>

      <div class="modal-action mt-6">
        <button class="btn" @click="handleClose">关闭</button>
      </div>
    </div>
    <div class="modal-backdrop" @click="handleClose"></div>
  </dialog>
</template>
