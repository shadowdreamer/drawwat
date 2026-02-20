<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'

defineExpose({
  clearCanvas:()=>{},
  exportAsImage:()=>{},
})
</script>

<template>
  <div class="tldraw-wrapper">
    <Tldraw />
  </div>
</template>

<style scoped>
.tldraw-wrapper {
  width: 100%;
  height: 600px;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid hsl(var(--b3));
  background-color: white;
}
</style>
