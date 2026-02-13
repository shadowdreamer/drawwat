<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '../store/auth'

const route = useRoute()
const authStore = useAuthStore()

const showLogin = route.query.showLogin === 'true'
</script>

<template>
  <div class="min-h-screen bg-base-200">
    <!-- Hero Section -->
    <section class="min-h-[80vh] flex items-center justify-center px-6">
      <div class="max-w-3xl w-full text-center">
        <!-- Brand -->
        <div class="mb-8">
          <span class="text-6xl sm:text-8xl opacity-80">🎨</span>
        </div>
        <h1 class="text-4xl sm:text-6xl lg:text-7xl font-bold mb-6 font-display">
          DrawWat
        </h1>
        <p class="text-lg sm:text-xl text-base-content/70 max-w-xl mx-auto mb-12 leading-relaxed">
          上传图片，设置答案，和朋友一起猜谜
        </p>

        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <RouterLink
            v-if="authStore.isLoggedIn"
            to="/create"
            class="btn btn-primary btn-lg gap-2 min-w-[160px]"
          >
            <i class="i-mdi-plus" />
            创建谜题
          </RouterLink>
          <button
            v-else
            @click="authStore.toAuthPage()"
            class="btn btn-primary btn-lg gap-2 min-w-[160px]"
          >
            <i class="i-mdi-github" />
            开始使用
          </button>

          <RouterLink
            v-if="authStore.isLoggedIn"
            to="/my-puzzles"
            class="btn btn-ghost btn-lg gap-2 min-w-[160px]"
          >
            <i class="i-mdi-gamepad-variant-outline" />
            我的谜题
          </RouterLink>
        </div>

        <!-- Login prompt -->
        <div v-if="showLogin && !authStore.isLoggedIn" class="alert alert-info mt-12 max-w-md mx-auto">
          <i class="i-mdi-information" />
          <div class="text-sm">
            请<span class="font-semibold">登录</span>后访问该页面
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-24 bg-base-100">
      <div class="container mx-auto px-6 max-w-5xl">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="card bg-base-200 border border-base-300">
            <div class="card-body items-center text-center gap-6">
              <div class="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <i class="i-mdi-image text-3xl text-primary" />
              </div>
              <h3 class="card-title text-lg font-display">上传图片</h3>
              <p class="text-sm text-base-content/60">支持 JPG、PNG、WEBP</p>
            </div>
          </div>
          <div class="card bg-base-200 border border-base-300">
            <div class="card-body items-center text-center gap-6">
              <div class="w-14 h-14 rounded-full bg-secondary/10 flex items-center justify-center">
                <i class="i-mdi-lightbulb-on text-3xl text-secondary" />
              </div>
              <h3 class="card-title text-lg font-display">设置答案</h3>
              <p class="text-sm text-base-content/60">可选添加提示语</p>
            </div>
          </div>
          <div class="card bg-base-200 border border-base-300">
            <div class="card-body items-center text-center gap-6">
              <div class="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
                <i class="i-mdi-share-variant text-3xl text-accent" />
              </div>
              <h3 class="card-title text-lg font-display">分享链接</h3>
              <p class="text-sm text-base-content/60">一键分享给朋友</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- How it works section -->
    <section class="py-24 bg-base-200">
      <div class="container mx-auto px-6 max-w-4xl">
        <h2 class="text-2xl sm:text-3xl font-bold text-center mb-16 font-display">如何玩？</h2>
        <div class="steps steps-vertical lg:steps-horizontal">
          <div class="step step-primary">
            <h3 class="text-lg font-semibold">创建谜题</h3>
            <p class="text-sm text-base-content/60 mt-2">上传图片，设置答案和提示</p>
          </div>
          <div class="step step-primary">
            <h3 class="text-lg font-semibold">分享链接</h3>
            <p class="text-sm text-base-content/60 mt-2">将链接发送给朋友</p>
          </div>
          <div class="step step-primary">
            <h3 class="text-lg font-semibold">猜测答案</h3>
            <p class="text-sm text-base-content/60 mt-2">获得智能提示，逐步接近答案</p>
          </div>
          <div class="step step-primary">
            <h3 class="text-lg font-semibold">查看排行</h3>
            <p class="text-sm text-base-content/60 mt-2">看谁最先猜出答案</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
