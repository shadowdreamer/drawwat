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

  // Redirect to OAuth authorization page
  function toAuthPage(provider: 'github' | 'google' = 'github') {
    const configs = {
      github: {
        authUrl: 'https://github.com/login/oauth/authorize',
        clientId: import.meta.env.VITE_GITHUB_CLIENT_ID || '',
      },
      google: {
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
      }
    }

    const config = configs[provider]
    const redirectUri = import.meta.env.VITE_OAUTH_REDIRECT_URI || `${window.location.origin}/auth/callback`

    const params = new URLSearchParams({
      client_id: config.clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: provider === 'github' ? 'read:user user:email' : 'openid profile email',
      state: generateRandomState()
    })

    // Save state to sessionStorage for verification
    sessionStorage.setItem('oauth_state', params.get('state')!)
    sessionStorage.setItem('oauth_provider', provider)

    window.location.href = `${config.authUrl}?${params.toString()}`
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
        user.value = data.user
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to get token:', error)
      throw error
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
    user,
    isLoggedIn,

    // Actions
    toAuthPage,
    getToken,
    logout
  }
}, {
  persist: {
    key: 'drawwat-auth',
    pick: ['token', 'user']
  }
})
