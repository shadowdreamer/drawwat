<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '../store/auth'

const route = useRoute()
const authStore = useAuthStore()

const showLogin = route.query.showLogin === 'true'
</script>

<template>
  <div class="min-h-[calc(100vh-4rem)] bg-base-200">
    <!-- Hero Section - Single Screen Layout -->
    <section class="min-h-[calc(100vh-4rem)] flex items-center px-4 sm:px-6 lg:px-8">
      <div class="max-w-6xl w-full mx-auto">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <!-- Left: Brand & CTA -->
          <div class="text-center lg:text-left">
            <div class="mb-4">
              <span class="text-5xl sm:text-6xl opacity-80">🎨</span>
            </div>
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 font-display">
              DrawWat
            </h1>
            <p class="text-base sm:text-lg text-base-content/70 mb-8 leading-relaxed">
              上传图片，设置答案，和朋友一起猜谜
            </p>

            <!-- CTA Buttons -->
            <div class="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <RouterLink
                v-if="authStore.isLoggedIn"
                to="/create"
                class="btn btn-primary gap-2 min-w-[140px]"
              >
                <i class="i-lucide-plus" />
                创建谜题
              </RouterLink>
              <button
                v-else
                @click="authStore.toAuthPage()"
                class="btn btn-primary gap-2 min-w-[140px]"
              >
                <i class="i-lucide-github" />
                开始使用
              </button>

              <RouterLink
                v-if="authStore.isLoggedIn"
                to="/my-puzzles"
                class="btn btn-outline gap-2 min-w-[140px]"
              >
                <i class="i-lucide-gamepad-2" />
                我的谜题
              </RouterLink>
            </div>

            <!-- Login prompt -->
            <div v-if="showLogin && !authStore.isLoggedIn" class="alert alert-info mt-6 max-w-md mx-auto lg:mx-0">
              <i class="i-lucide-info" />
              <div class="text-sm">
                请<span class="font-semibold">登录</span>后访问该页面
              </div>
            </div>
          </div>

          <!-- Right: Feature Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            <div class="card bg-base-100 border border-base-300 shadow-sm">
              <div class="card-body p-4 flex-row items-center gap-4">
                <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <i class="i-lucide-image text-2xl text-primary" />
                </div>
                <div>
                  <h3 class="font-semibold font-display">上传图片</h3>
                  <p class="text-xs text-base-content/60">支持 JPG、PNG、WEBP</p>
                </div>
              </div>
            </div>

            <div class="card bg-base-100 border border-base-300 shadow-sm">
              <div class="card-body p-4 flex-row items-center gap-4">
                <div class="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                  <i class="i-lucide-lightbulb text-2xl text-secondary" />
                </div>
                <div>
                  <h3 class="font-semibold font-display">设置答案</h3>
                  <p class="text-xs text-base-content/60">可选添加提示语</p>
                </div>
              </div>
            </div>

            <div class="card bg-base-100 border border-base-300 shadow-sm">
              <div class="card-body p-4 flex-row items-center gap-4">
                <div class="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <i class="i-lucide-share-2 text-2xl text-accent" />
                </div>
                <div>
                  <h3 class="font-semibold font-display">分享链接</h3>
                  <p class="text-xs text-base-content/60">一键分享给朋友</p>
                </div>
              </div>
            </div>

            <div class="card bg-base-100 border border-base-300 shadow-sm">
              <div class="card-body p-4 flex-row items-center gap-4">
                <div class="w-12 h-12 rounded-full bg-info/10 flex items-center justify-center shrink-0">
                  <i class="i-lucide-sparkles text-2xl text-info" />
                </div>
                <div>
                  <h3 class="font-semibold font-display">智能提示</h3>
                  <p class="text-xs text-base-content/60">类似 Wordle 的提示系统</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
