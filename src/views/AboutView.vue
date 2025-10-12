<script setup lang="ts">
import { ref, onMounted } from 'vue'

</script>

<template>
  <div class="container mx-auto p-6">
    <h1 class="text-3xl font-bold mb-6">About This Template</h1>
    
    <div class="card bg-base-100 shadow-xl mb-6">
      <div class="card-body">
        <h2 class="card-title">Tech Stack</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="badge badge-primary">Cloudflare Workers</div>
          <div class="badge badge-secondary">Hono</div>
          <div class="badge badge-accent">Vue 3</div>
          <div class="badge badge-info">TypeScript</div>
          <div class="badge badge-success">UnoCSS</div>
          <div class="badge badge-warning">DaisyUI</div>
          <div class="badge badge-neutral">Pinia</div>
          <div class="badge badge-outline">Cloudflare D1</div>
        </div>
      </div>
    </div>

    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">Features</h2>
        <ul class="list-disc list-inside space-y-2">
          <li>Serverless architecture with Cloudflare Workers</li>
          <li>Modern frontend with Vue 3 and Composition API</li>
          <li>Rapid UI development with UnoCSS and DaisyUI</li>
          <li>Type-safe development with TypeScript</li>
          <li>State management with Pinia and persistence</li>
          <li>Database support with Cloudflare D1</li>
          <li>Optimized for performance and edge computing</li>
        </ul>
      </div>
    </div>
  </div>
</template>
