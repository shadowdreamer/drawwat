import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export interface User {
  id: string
  provider: string
  username: string
  avatar_url?: string
  email?: string
  is_new_user?: boolean
}

export const useAuthStore = defineStore('auth', () => {
  // ========== State ==========
  const token = ref<string>('')
  const refreshToken = ref<string>('')
  const user = ref<User | null>(null)

  // ========== Computed ==========
  const isLoggedIn = computed(() => !!token.value && !!user.value)

  // ========== Actions ==========

  // Generate random state for OAuth CSRF protection
  function generateRandomState(): string {
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')
  }

  // Redirect to Bangumi OAuth authorization page
  function toAuthPage() {
    const clientId = import.meta.env.VITE_BGM_CLIENT_ID
    const redirectUri = import.meta.env.VITE_BGM_REDIRECT_URI || `${window.location.origin}/auth/callback`

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      state: generateRandomState()
    })

    // Save state to sessionStorage for verification
    sessionStorage.setItem('oauth_state', params.get('state')!)

    window.location.href = `https://bgm.tv/oauth/authorize?${params.toString()}`
  }

  // Exchange authorization code for access token
  async function getToken(code: string, state: string): Promise<boolean> {
    // Verify state to prevent CSRF
    const savedState = sessionStorage.getItem('oauth_state')
    if (!savedState || savedState !== state) {
      throw new Error('Invalid OAuth state')
    }
    sessionStorage.removeItem('oauth_state')

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Authentication failed')
      }

      const data = await res.json()

      if (data.access_token) {
        token.value = data.access_token
        refreshToken.value = data.refresh_token
        user.value = data.user
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to get token:', error)
      throw error
    }
  }

  // Refresh access token
  async function refreshAccessToken(): Promise<boolean> {
    if (!refreshToken.value) return false

    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refreshToken.value })
      })

      if (!res.ok) {
        logout()
        return false
      }

      const data = await res.json()

      if (data.access_token) {
        token.value = data.access_token
        refreshToken.value = data.refresh_token
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to refresh token:', error)
      logout()
      return false
    }
  }

  // Fetch user info from API
  async function fetchUserInfo() {
    if (!token.value) {
      user.value = null
      return
    }

    try {
      const res = await fetch('/api/user/me', {
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      })

      if (res.ok) {
        const data = await res.json()
        user.value = data
      } else {
        // Token might be invalid
        logout()
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error)
    }
  }

  // Logout
  function logout() {
    token.value = ''
    refreshToken.value = ''
    user.value = null
  }

  // Watch token changes to fetch user info
  watch(token, (val) => {
    if (val && !user.value) {
      fetchUserInfo()
    } else if (!val) {
      user.value = null
    }
  })

  // Initialize - fetch user info if token exists
  if (token.value && !user.value) {
    fetchUserInfo()
  }

  return {
    // State
    token,
    refreshToken,
    user,
    isLoggedIn,

    // Actions
    toAuthPage,
    getToken,
    refreshAccessToken,
    logout
  }
}, {
  persist: {
    key: 'drawwat-auth',
    pick: ['token', 'refreshToken', 'user']
  }
})
