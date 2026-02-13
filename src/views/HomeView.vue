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
    <div class="hero min-h-screen bg-base-200">
      <div class="hero-content text-center">
        <div class="max-w-2xl">
          <div class="text-6xl md:text-8xl font-bold text-primary mb-6">
            🎨 猜谜
          </div>
          <h1 class="text-3xl md:text-5xl font-bold mb-6">
            DrawWat
          </h1>
          <p class="py-6 text-lg md:text-xl text-base-content/80">
            上传图片，设置答案，和朋友一起猜谜！<br>
            类似 Wordle 的智能提示，让猜谜更有趣。
          </p>

          <!-- Feature cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div class="card bg-base-100 shadow-xl">
              <div class="card-body items-center text-center">
                <i class="i-mdi-image text-4xl text-primary mb-2" />
                <h3 class="card-title text-lg">上传图片</h3>
                <p class="text-sm text-base-content/70">支持 JPG、PNG、WEBP</p>
              </div>
            </div>
            <div class="card bg-base-100 shadow-xl">
              <div class="card-body items-center text-center">
                <i class="i-mdi-lightbulb text-4xl text-secondary mb-2" />
                <h3 class="card-title text-lg">设置提示</h3>
                <p class="text-sm text-base-content/70">可选添加提示语</p>
              </div>
            </div>
            <div class="card bg-base-100 shadow-xl">
              <div class="card-body items-center text-center">
                <i class="i-mdi-share-variant text-4xl text-accent mb-2" />
                <h3 class="card-title text-lg">分享链接</h3>
                <p class="text-sm text-base-content/70">一键分享给朋友</p>
              </div>
            </div>
          </div>

          <!-- CTA Buttons -->
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <RouterLink
              v-if="authStore.isLoggedIn"
              to="/create"
              class="btn btn-primary btn-lg gap-2"
            >
              <i class="i-mdi-plus-circle" />
              创建谜题
            </RouterLink>
            <button
              v-else
              @click="authStore.toAuthPage()"
              class="btn btn-primary btn-lg gap-2"
            >
              <i class="i-mdi-github" />
              GitHub 登录开始
            </button>

            <RouterLink
              to="/my-puzzles"
              v-if="authStore.isLoggedIn"
              class="btn btn-outline btn-lg gap-2"
            >
              <i class="i-mdi-gamepad-variant" />
              我的谜题
            </RouterLink>
          </div>

          <!-- Login prompt (if redirected) -->
          <div v-if="showLogin && !authStore.isLoggedIn" class="alert alert-info mt-6">
            <i class="i-mdi-information text-xl" />
            <div>
              <h3 class="font-bold">需要登录</h3>
              <div class="text-sm">请登录后访问该页面</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- How it works section -->
    <div class="py-16 bg-base-100">
      <div class="container mx-auto px-4 max-w-4xl">
        <h2 class="text-3xl font-bold text-center mb-12">如何玩？</h2>
        <div class="steps steps-vertical lg:steps-horizontal w-full">
          <div class="step step-primary">
            <div class="text-left lg:text-center">
              <h3 class="text-lg font-bold">创建谜题</h3>
              <p class="text-sm text-base-content/70">上传有趣的图片，设置答案和提示</p>
            </div>
          </div>
          <div class="step step-primary">
            <div class="text-left lg:text-center">
              <h3 class="text-lg font-bold">分享链接</h3>
              <p class="text-sm text-base-content/70">将链接发送给朋友</p>
            </div>
          </div>
          <div class="step step-primary">
            <div class="text-left lg:text-center">
              <h3 class="text-lg font-bold">猜测答案</h3>
              <p class="text-sm text-base-content/70">朋友提交猜测，获得智能提示</p>
            </div>
          </div>
          <div class="step step-primary">
            <div class="text-left lg:text-center">
              <h3 class="text-lg font-bold">查看排行榜</h3>
              <p class="text-sm text-base-content/70">看谁最先猜出答案</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
