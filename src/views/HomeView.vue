<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '../store/auth'
const route = useRoute()
const authStore = useAuthStore()
const showLogin = computed(() => route.query.showLogin === 'true')
const demoGuess = ref('')
const demoResult = ref('')
const demoSolved = ref(false)
function tryGuess() {
  if (!demoGuess.value.trim()) return
  demoSolved.value = ['土星', 'saturn'].includes(demoGuess.value.trim().toLowerCase())
  demoResult.value = demoSolved.value ? '猜对啦！是土星。你的想象力很在线。' : '再想想：它是太阳系里戴着漂亮光环的行星。'
}
</script>

<template>
  <div class="home-page">
    <section class="home-hero page-width">
      <div class="hero-copy">
        <span class="eyebrow"><span class="status-dot" /> 一笔灵感，一场心有灵犀</span>
        <h1>把脑洞画出来，<br>让灵感<span class="ink-gradient">被猜中。</span></h1>
        <p class="hero-description">不必是画家，也能创造惊喜。<br>画一个小谜题，分享给朋友，看看谁最懂你的奇思妙想。</p>
        <div class="hero-actions">
          <RouterLink v-if="authStore.isLoggedIn" to="/create" class="btn btn-primary hero-cta"><i class="i-lucide-pencil" /> 开始画一个 <i class="i-lucide-arrow-up-right" /></RouterLink>
          <button v-else class="btn btn-primary hero-cta" @click="authStore.toAuthPage()"><i class="i-lucide-pencil" /> 开始画一个 <i class="i-lucide-arrow-up-right" /></button>
          <RouterLink to="/plaza" class="btn btn-outline hero-cta">去广场猜一猜 <i class="i-lucide-arrow-right" /></RouterLink>
        </div>
        <p class="hero-footnote"><i class="i-lucide-sparkles" /> 随手涂鸦也很棒，想象力才是主角</p>
        <div v-if="showLogin && !authStore.isLoggedIn" role="status" class="alert alert-info mt-6">登录 Bangumi 后，就可以开始绘图或参与猜谜。</div>
      </div>
      <div class="hero-playground">
        <div class="orbit-label"><span class="tiny-star">✦</span> 今天的脑洞，飞向宇宙</div>
        <div class="demo-card">
          <div class="demo-card-top"><span><i class="i-lucide-pencil-line" /> 灵感试画间</span><span class="demo-badge">试玩示例</span></div>
          <div class="demo-art" role="img" aria-label="一颗戴着光环的手绘行星，周围有星星">
            <svg viewBox="0 0 480 310" aria-hidden="true">
              <g fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path d="M83 78v22m-11-11h22M378 216v20m-10-10h20M372 64l4 10 10 4-10 4-4 10-4-10-10-4 10-4Z" stroke="#9684c4" stroke-width="2.6" />
                <circle cx="130" cy="247" r="3" fill="#b0a2cf" stroke="none"/><circle cx="333" cy="41" r="3" fill="#d7ac82" stroke="none"/>
                <path d="M163 158C155 116 185 77 229 75c46-4 82 24 88 69 7 43-23 84-66 89-47 7-82-28-88-75Z" fill="#ede3ff" stroke="#4b3a67" stroke-width="3"/>
                <path d="M182 108c19 13 49 19 69 18m-82 23c27 22 61 25 95 23m-69 30c17 10 37 15 53 14" stroke="#c4a9ed" stroke-width="10"/>
                <path d="M166 130c-50 1-84 10-86 24-4 23 64 49 153 59 89 10 164 1 167-22 2-14-31-31-82-44m-149-4c-28 1-45 5-45 11-1 12 49 29 113 36s117 3 118-9c1-6-14-14-39-21" stroke="#4b3a67" stroke-width="3" fill="#f9d8b6" transform="rotate(-23 240 170)"/>
                <path d="M163 158C155 116 185 77 229 75c46-4 82 24 88 69" fill="#ede3ff" stroke="#4b3a67" stroke-width="3"/>
                <path d="M182 108c19 13 49 19 69 18" stroke="#c4a9ed" stroke-width="10"/>
                <path d="m329 268 14-8m-6 18 17-2" stroke="#bca2d7" stroke-width="2" />
              </g>
            </svg>
            <span class="art-caption">画得不标准，快乐很标准。</span>
          </div>
          <form class="demo-guess" @submit.prevent="tryGuess">
            <label for="demo-answer">你猜，这是哪颗星球？<span>2 个字</span></label>
            <div class="demo-input-row"><input id="demo-answer" v-model="demoGuess" class="input" placeholder="输入你的灵光一闪…" maxlength="30"><button class="btn btn-primary" :disabled="!demoGuess.trim()" aria-label="提交试玩答案"><i class="i-lucide-arrow-right" /></button></div>
            <p v-if="demoResult" class="demo-feedback" :class="{ solved: demoSolved }" role="status">{{ demoResult }}</p>
          </form>
        </div>
        <span class="floating-note"><i class="i-lucide-heart" /> 快乐，不需要画技</span>
      </div>
    </section>
    <section id="how-it-works" class="how-section page-width">
      <div class="section-heading"><div><span class="eyebrow">HOW TO PLAY</span><h2>把一个脑洞，变成一场游戏。</h2></div><p>从落笔到会心一笑，只需要三步。</p></div>
      <div class="steps-grid">
        <article><span class="step-number">01</span><div class="step-icon lavender"><i class="i-lucide-pencil-line" /></div><h3>随心画一点</h3><p>一只猫、一部电影、一个冷笑话。<br>用线条留下只有你知道的线索。</p></article>
        <article><span class="step-number">02</span><div class="step-icon peach"><i class="i-lucide-lightbulb" /></div><h3>藏好小谜底</h3><p>写下答案，再留一点提示。<br>让猜谜有挑战，也有恍然大悟。</p></article>
        <article><span class="step-number">03</span><div class="step-icon mint"><i class="i-lucide-send" /></div><h3>把快乐传出去</h3><p>分享链接给朋友，或公开到广场。<br>等一个「我知道了！」的瞬间。</p></article>
      </div>
    </section>
    <footer class="site-footer page-width"><span class="footer-brand">DrawWat<span>让想象力，有来有往。</span></span><a href="https://github.com/shadowdreamer/drawwat" target="_blank" rel="noopener noreferrer"><i class="i-lucide-github" /> 在 GitHub 上查看 <i class="i-lucide-arrow-up-right" /></a></footer>
  </div>
</template>
