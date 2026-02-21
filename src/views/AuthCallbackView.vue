<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../store/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const { code, state } = route.query

    if (!code || !state) {
      throw new Error('缺少必要参数')
    }

    const success = await authStore.getToken(code as string, state as string)

    if (success) {
      // Login successful, redirect back or to home
      const redirect = route.query.redirect as string || '/'
      router.push(redirect)
    } else {
      throw new Error('登录失败，请重试')
    }
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : '登录失败'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-base-200">
    <div v-if="loading" class="text-center">
      <div class="loading loading-spinner loading-lg mb-4"></div>
      <p class="text-lg">正在登录...</p>
    </div>

    <div v-else-if="error" class="alert alert-error max-w-md">
      <i class="i-lucide-alert-circle text-xl" />
      <div>
        <h3 class="font-bold">登录失败</h3>
        <div class="text-sm">{{ error }}</div>
        <button class="btn btn-sm btn-error mt-2" @click="router.push('/')">
          返回首页
        </button>
      </div>
    </div>
  </div>
</template>
