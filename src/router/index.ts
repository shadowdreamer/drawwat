import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: { title: 'DrawWat - 图片谜题猜谜' }
    },
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: () => import('../views/AuthCallbackView.vue'),
      meta: { title: '登录中...' }
    },
    {
      path: '/create',
      name: 'create',
      component: () => import('../views/CreatePuzzleView.vue'),
      meta: { requiresAuth: true, title: '创建谜题' }
    },
    {
      path: '/puzzle/:id',
      name: 'puzzle',
      component: () => import('../views/PuzzleView.vue'),
      meta: { requiresAuth: true, title: '猜谜' }
    },
    {
      path: '/puzzle/:id/stats',
      name: 'puzzle-stats',
      component: () => import('../views/PuzzleStatsView.vue'),
      meta: { requiresAuth: true, title: '谜题统计' }
    },
    {
      path: '/my-puzzles',
      name: 'my-puzzles',
      component: () => import('../views/MyPuzzlesView.vue'),
      meta: { requiresAuth: true, title: '我的谜题' }
    },
  ],
})

// Navigation guard for authentication
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Update page title
  if (to.meta.title) {
    document.title = to.meta.title as string
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    // Redirect to home with query params to return after login
    next({
      name: 'home',
      query: { redirect: to.fullPath, showLogin: 'true' }
    })
  } else {
    next()
  }
})

export default router
