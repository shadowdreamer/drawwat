<script setup lang="ts">
import type { TldrawElement } from "@/tldraw";
import { ref, onMounted, onUnmounted } from 'vue'

defineExpose({
  clearCanvas:()=>{
    const board = document.getElementById('my-board') as TldrawElement;
    board?.clearCanvas();
  },
  exportAsImage:async ()=>{
    const board = document.getElementById('my-board') as TldrawElement;
    const blob = await board?.exportImage();
    if (blob) {
      // 创建下载链接
      return blob.blob
    }
  },
})
</script>

<template>
  <div class="tldraw-wrapper">
    <web-tldraw id="my-board"></web-tldraw>
  </div>
</template>

<style scoped>
.tldraw-wrapper {
  width: 100%;
  height: 100%;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid hsl(var(--b3));
  background-color: white;
}
</style>
