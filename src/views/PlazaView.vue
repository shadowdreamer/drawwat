<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { getR2ImageUrl } from '../constants'
import { createBangumiIdResolver, type BangumiIdResolver } from '../utils/bangumi'
const puzzles = ref<any[]>([])
const loading = ref(true)
const error = ref('')
const currentPage = ref(1)
const pageSize = 20
const total = ref(0)
const totalPages = ref(0)
const filter = ref('all')
const filters = [{ value: 'all', label: '全部谜题' }, { value: 'hint', label: '有提示 · 轻松猜' }, { value: 'permanent', label: '长期有效' }]
const filteredPuzzles = computed(() => puzzles.value.filter(p => filter.value === 'hint' ? !!p.hint?.trim() : filter.value === 'permanent' ? !p.expires_at : true))
const displayedPages = computed(() => {
  const pages: (number | string)[] = []
  for (let i = 1; i <= totalPages.value; i++) {
    if (i === 1 || i === totalPages.value || Math.abs(i - currentPage.value) <= 1) pages.push(i)
    else if (pages[pages.length - 1] !== '...') pages.push('...')
  }
  return pages
})
const resolverMap = new Map<string, BangumiIdResolver>()
function getResolver(username: string) {
  if (!resolverMap.has(username)) resolverMap.set(username, createBangumiIdResolver(username))
  return resolverMap.get(username)!
}
function formatDate(dateString: string) {
  const days = Math.floor((Date.now() - new Date(dateString).getTime()) / 86400000)
  return days === 0 ? '今天' : days === 1 ? '昨天' : days < 7 ? `${days}天前` : new Date(dateString).toLocaleDateString('zh-CN')
}
async function loadPublicPuzzles(page = currentPage.value) {
  loading.value = true
  error.value = ''
  try {
    const response = await fetch(`/api/public-puzzles?page=${page}&pageSize=${pageSize}`)
    if (!response.ok) throw new Error('谜题暂时没有加载出来，请再试一次。')
    const data = await response.json()
    puzzles.value = data.puzzles || []
    total.value = data.total || 0
    totalPages.value = data.totalPages || 0
    currentPage.value = data.page || 1
  } catch (err) { error.value = err instanceof Error ? err.message : '加载失败，请稍后重试。' }
  finally { loading.value = false }
}
function goToPage(page: number) {
  if (page < 1 || page > totalPages.value) return
  loadPublicPuzzles(page)
  window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
}
onMounted(() => loadPublicPuzzles())
</script>

<template>
  <div class="content-page page-width">
    <header class="page-heading"><div><span class="eyebrow">THE PLAYGROUND</span><h1>来接住这些脑洞。</h1><p>每一幅画，都藏着一个等你发现的答案。</p></div><RouterLink to="/create" class="btn btn-primary"><i class="i-lucide-plus" /> 我也画一个</RouterLink></header>
    <div class="gallery-toolbar"><div class="filter-tabs" aria-label="谜题筛选"><button v-for="item in filters" :key="item.value" class="filter-tab" :aria-pressed="filter === item.value" @click="filter = item.value">{{ item.label }}</button></div><span class="gallery-count">{{ filter === 'all' ? `共 ${total} 个脑洞 · 最新发布` : `本页筛选 · ${filteredPuzzles.length} 个谜题` }}</span></div>
    <div v-if="loading" class="empty-panel" role="status"><span class="loading loading-spinner loading-lg" /><p class="mt-4">正在收集大家的奇思妙想…</p></div>
    <div v-else-if="error" class="empty-panel" role="alert"><i class="i-lucide-cloud-off" /><h2>稍等，灵感还在路上</h2><p>{{ error }}</p><button class="btn btn-primary" @click="loadPublicPuzzles()">重新加载</button></div>
    <div v-else-if="!puzzles.length" class="empty-panel"><i class="i-lucide-pencil-line" /><h2>第一份灵感，留给你。</h2><p>广场还没有公开谜题，画一个让大家猜猜吧。</p><RouterLink to="/create" class="btn btn-primary">创建第一个谜题 <i class="i-lucide-arrow-right" /></RouterLink></div>
    <template v-else>
      <div v-if="!filteredPuzzles.length" class="empty-panel"><i class="i-lucide-search" /><h2>本页还没有这类谜题</h2><p>切换筛选条件，或者翻到下一页发现更多。</p><button class="btn btn-outline" @click="filter = 'all'">查看本页全部</button></div>
      <div v-else class="puzzle-grid">
        <RouterLink v-for="puzzle in filteredPuzzles" :key="puzzle.id" :to="`/puzzle/${puzzle.id}`" class="puzzle-tile" :aria-label="`挑战 ${puzzle.creator.username} 的谜题`">
          <figure><img :src="getR2ImageUrl(puzzle.image_url)" :alt="`${puzzle.creator.username} 绘制的谜题`" loading="lazy"><span class="tile-cta">猜猜看 <i class="i-lucide-arrow-up-right" /></span></figure>
          <div class="tile-body"><div class="tile-author"><span class="tile-avatar"><img v-if="puzzle.creator.avatar_url" :src="puzzle.creator.avatar_url" alt="" loading="lazy"><span v-else>{{ puzzle.creator.username?.[0]?.toUpperCase() || '?' }}</span></span><span class="tile-author-name">{{ getResolver(puzzle.creator.username)?.nickname || puzzle.creator.username }}</span><i v-if="puzzle.hint" class="i-lucide-lightbulb text-warning ml-auto" title="有提示" /></div><div class="tile-meta"><span title="猜中人数"><i class="i-lucide-check-check" /> {{ puzzle.solves_count || 0 }} 猜中</span><span title="猜测次数"><i class="i-lucide-message-circle" /> {{ puzzle.guesses_count || 0 }}</span><time>{{ formatDate(puzzle.created_at) }}</time></div></div>
        </RouterLink>
      </div>
      <nav v-if="totalPages > 1" class="flex justify-center gap-2 mt-10" aria-label="谜题分页"><button class="btn btn-outline btn-sm" :disabled="currentPage === 1" aria-label="上一页" @click="goToPage(currentPage - 1)"><i class="i-lucide-chevron-left" /></button><template v-for="(page, index) in displayedPages" :key="index"><button v-if="typeof page === 'number'" class="btn btn-sm" :class="page === currentPage ? 'btn-primary' : 'btn-outline'" :aria-current="page === currentPage ? 'page' : undefined" @click="goToPage(page)">{{ page }}</button><span v-else class="px-2 self-center">…</span></template><button class="btn btn-outline btn-sm" :disabled="currentPage === totalPages" aria-label="下一页" @click="goToPage(currentPage + 1)"><i class="i-lucide-chevron-right" /></button></nav>
    </template>
  </div>
</template>
