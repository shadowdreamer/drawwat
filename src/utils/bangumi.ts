import { reactive } from 'vue'

const userIdCache = new Map<string, string>()
const pendingRequests = new Map<string, Promise<string | null>>()

export interface BgmUser {
  avatar: {
    large: string
    medium: string
    small: string
  }
  sign: string
  url: string
  username: string
  nickname: string
  id: string
  user_group: string
}

export interface BangumiIdResolver {
  isResolved: boolean
  id: string
  nickname: string | null
}

/**
 * Fetch user info from bgm.tv API via our proxy
 */
async function fetchBgmUser(userId: string): Promise<BgmUser | null> {
  const response = await fetch(`/api/bangumi/user/${userId}`)

  if (!response.ok) {
    return null
  }

  return response.json() as Promise<BgmUser>
}

/**
 * Get nickname by bangumi user ID with caching and request deduplication
 */
async function getNicknameById(userId: string): Promise<string | null> {
  // Check cache first
  const cached = userIdCache.get(userId)
  if (cached) {
    return cached
  }

  // Check if there's a pending request for this user ID
  const pending = pendingRequests.get(userId)
  if (pending) {
    return pending
  }

  // Create new request
  const promise = (async () => {
    try {
      const user = await fetchBgmUser(userId)
      if (user?.nickname) {
        userIdCache.set(userId, user.nickname)
        return user.nickname
      }
      return null
    } finally {
      // Clean up pending request
      pendingRequests.delete(userId)
    }
  })()

  pendingRequests.set(userId, promise)
  return promise
}

/**
 * Create a Bangumi ID resolver that starts as unresolved and resolves to nickname
 * when the promise completes
 *
 * @example
 * const resolver = createBangumiIdResolver('69822')
 * // Display resolver.id while loading (e.g., "Loading 69822...")
 * // When resolver.isResolved is true, display resolver.nickname
 */
export function createBangumiIdResolver(userId: string): BangumiIdResolver {
  const state = reactive<BangumiIdResolver>({
    isResolved: false,
    id: userId,
    nickname: null,
  })

  // Start the async resolution
  getNicknameById(userId).then((result) => {
    state.nickname = result
    state.isResolved = true
  })

  return state
}

/**
 * Resolve a bangumi user ID to nickname (utility function for direct usage)
 */
export async function resolveBangumiNickname(userId: string): Promise<string | null> {
  return getNicknameById(userId)
}
