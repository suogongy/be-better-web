/**
 * 认证状态持久化工具
 * 用于在页面刷新后保持认证状态
 */

const AUTH_STORAGE_KEY = 'be-better-auth-state'
const AUTH_TIMESTAMP_KEY = 'be-better-auth-timestamp'
const AUTH_EXPIRY_TIME = 24 * 60 * 60 * 1000 // 24小时

interface AuthState {
  user: {
    id: string
    email: string
    name?: string
    avatar_url?: string
  } | null
  timestamp: number
}

export const authStorage = {
  /**
   * 保存认证状态到本地存储
   */
  saveAuthState(user: AuthState['user']): void {
    if (typeof window === 'undefined') return
    
    try {
      const authState: AuthState = {
        user,
        timestamp: Date.now()
      }
      
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState))
      localStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString())
    } catch (error) {
      console.warn('保存认证状态失败:', error)
    }
  },

  /**
   * 从本地存储获取认证状态
   */
  getAuthState(): AuthState['user'] | null {
    if (typeof window === 'undefined') return null
    
    try {
      const authStateStr = localStorage.getItem(AUTH_STORAGE_KEY)
      const timestampStr = localStorage.getItem(AUTH_TIMESTAMP_KEY)
      
      if (!authStateStr || !timestampStr) return null
      
      const authState: AuthState = JSON.parse(authStateStr)
      const timestamp = parseInt(timestampStr, 10)
      
      // 检查是否过期
      if (Date.now() - timestamp > AUTH_EXPIRY_TIME) {
        this.clearAuthState()
        return null
      }
      
      return authState.user
    } catch (error) {
      console.warn('获取认证状态失败:', error)
      this.clearAuthState()
      return null
    }
  },

  /**
   * 清除本地存储的认证状态
   */
  clearAuthState(): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      localStorage.removeItem(AUTH_TIMESTAMP_KEY)
    } catch (error) {
      console.warn('清除认证状态失败:', error)
    }
  },

  /**
   * 检查认证状态是否有效
   */
  isAuthStateValid(): boolean {
    if (typeof window === 'undefined') return false
    
    try {
      const timestampStr = localStorage.getItem(AUTH_TIMESTAMP_KEY)
      if (!timestampStr) return false
      
      const timestamp = parseInt(timestampStr, 10)
      return Date.now() - timestamp <= AUTH_EXPIRY_TIME
    } catch (error) {
      return false
    }
  }
}
