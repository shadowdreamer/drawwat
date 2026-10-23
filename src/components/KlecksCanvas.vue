<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { KlecksFrame } from './drawing-canvas'

const emit = defineEmits<{ submit: [] }>()
const frame = ref<HTMLIFrameElement | null>(null)
const loading = ref(true)
const error = ref('')
const draftWarning = ref('')
const frameUrl = `${import.meta.env.BASE_URL}klecks-frame.html`
let disposed = false

function getCanvas() {
  return (frame.value?.contentWindow as KlecksFrame | null)?.drawwatCanvas
}

async function onLoad() {
  loading.value = true
  error.value = ''
  try {
    const canvas = getCanvas()
    if (!canvas) throw new Error('画板加载失败，请重试')
    await canvas.ready
  } catch (cause) {
    if (!disposed) error.value = cause instanceof Error ? cause.message : '画板加载失败，请重试'
  } finally {
    if (!disposed) loading.value = false
  }
}

function onMessage(event: MessageEvent) {
  if (event.origin !== location.origin || event.source !== frame.value?.contentWindow) return
  if (event.data?.type === 'drawwat-klecks-warning' && typeof event.data.message === 'string') {
    draftWarning.value = event.data.message
  }
  if (event.data?.type === 'drawwat-klecks-submit') emit('submit')
}

function reload() {
  loading.value = true
  error.value = ''
  if (frame.value) frame.value.src = frameUrl
}

async function clearCanvas() {
  const canvas = getCanvas()
  if (!canvas || loading.value || error.value) throw new Error('画板尚未就绪')
  await canvas.clearCanvas()
  loading.value = true
}

async function exportAsImage() {
  const canvas = getCanvas()
  if (!canvas || loading.value || error.value) throw new Error('画板尚未就绪，请稍后重试')
  return canvas.exportAsImage()
}

async function saveDraft() {
  if (!loading.value && !error.value) await getCanvas()?.saveDraft?.()
}

onMounted(() => window.addEventListener('message', onMessage))
onBeforeUnmount(() => {
  disposed = true
  window.removeEventListener('message', onMessage)
})
defineExpose({ clearCanvas, exportAsImage, saveDraft })
</script>

<template>
  <div class="klecks-wrapper">
    <div v-if="draftWarning" role="status" class="text-xs p-2 bg-warning text-warning-content">{{ draftWarning }}</div>
    <div class="klecks-editor">
      <iframe ref="frame" :src="frameUrl" title="Klecks 绘画板" @load="onLoad" />
      <div v-if="loading || error" class="klecks-status" role="status">
        <template v-if="error">{{ error }} <button class="btn btn-sm" @click="reload">重新加载</button></template>
        <template v-else><span class="loading loading-spinner" /> 正在加载画板…</template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.klecks-wrapper { width: 100%; height: 100%; display: flex; flex-direction: column; background: white; color-scheme: light; }
.klecks-editor { position: relative; flex: 1; min-height: 0; }
iframe { width: 100%; height: 100%; border: 0; display: block; }
.klecks-status { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 12px; background: white; color: #333; }
</style>
