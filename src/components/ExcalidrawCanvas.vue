<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Excalidraw, exportToBlob, restore } from '@excalidraw/excalidraw'
import type { ExcalidrawImperativeAPI, ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types'
import '@excalidraw/excalidraw/index.css'

const DRAFT_KEY = 'drawwat-excalidraw-draft-v1'
const CANVAS_BACKGROUND = '#ffffff'
const container = ref<HTMLDivElement | null>(null)
let root: Root | null = null
let api: ExcalidrawImperativeAPI | null = null
let saveTimer: ReturnType<typeof setTimeout> | undefined
const draftWarning = ref('')
let initialData: ExcalidrawInitialDataState = { appState: { viewBackgroundColor: CANVAS_BACKGROUND } }

function saveDraft() {
  if (!api) return
  try {
    const { scrollX, scrollY, zoom } = api.getAppState()
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      elements: api.getSceneElements(),
      files: api.getFiles(),
      appState: { viewBackgroundColor: CANVAS_BACKGROUND, scrollX, scrollY, zoom },
    }))
    draftWarning.value = ''
  } catch {
    draftWarning.value = '草稿无法保存到浏览器，请及时生成谜题。'
  }
}

function renderEditor() {
  root?.render(createElement(Excalidraw, {
    initialData,
    langCode: 'zh-CN',
    theme: 'light',
    excalidrawAPI: (instance) => { api = instance },
    onChange: (_, appState) => {
      if (appState.viewBackgroundColor !== CANVAS_BACKGROUND) {
        api?.updateScene({ appState: { viewBackgroundColor: CANVAS_BACKGROUND } })
      }
      clearTimeout(saveTimer)
      saveTimer = setTimeout(saveDraft, 500)
    },
    UIOptions: { canvasActions: {
      loadScene: false,
      saveToActiveFile: false,
      export: false,
      toggleTheme: false,
      changeViewBackgroundColor: false,
    } },
  }))
}

onMounted(() => {
  try {
    const saved = localStorage.getItem(DRAFT_KEY)
    if (saved) {
      const draft = JSON.parse(saved)
      if (!draft || !Array.isArray(draft.elements) || !draft.files || typeof draft.files !== 'object') {
        throw new Error('Invalid draft')
      }
      initialData = restore(draft, null, null)
      initialData.appState = { ...initialData.appState, viewBackgroundColor: CANVAS_BACKGROUND }
    }
  } catch {
    draftWarning.value = '无法恢复本地草稿，已打开空白画板。'
  }
  root = createRoot(container.value!)
  renderEditor()
  window.addEventListener('pagehide', saveDraft)
})
onBeforeUnmount(() => {
  clearTimeout(saveTimer)
  saveDraft()
  window.removeEventListener('pagehide', saveDraft)
  root?.unmount()
  root = null
  api = null
})

function clearCanvas() {
  clearTimeout(saveTimer)
  api?.resetScene()
  saveDraft()
}

async function exportAsImage(): Promise<Blob | null> {
  if (!api) return null
  const elements = api.getSceneElements()
  if (!elements.length) return null
  return exportToBlob({
    elements,
    files: api.getFiles(),
    appState: {
      ...api.getAppState(),
      viewBackgroundColor: CANVAS_BACKGROUND,
      exportBackground: true,
      exportWithDarkMode: false,
      exportEmbedScene: false,
    },
    mimeType: 'image/webp',
    quality: 0.9,
    exportPadding: 10,
    getDimensions: (width: number, height: number) => ({
      width,
      height,
      scale: Math.min(1, 1280 / Math.max(width, height)),
    }),
  })
}

defineExpose({ clearCanvas, exportAsImage })
</script>

<template>
  <div class="excalidraw-wrapper">
    <div v-if="draftWarning" role="status" class="text-xs p-2 bg-warning text-warning-content">{{ draftWarning }}</div>
    <div ref="container" class="editor" />
  </div>
</template>

<style scoped>
.excalidraw-wrapper { width: 100%; height: 100%; display: flex; flex-direction: column; background: white; color-scheme: light; }
.editor { flex: 1; min-height: 0; }
</style>

